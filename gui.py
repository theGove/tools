"""Graphical front end for the Availabooks command-line tools.

Wraps download.py, preview.py, publish.py and publish-api.py so authors can
run them from a window instead of a terminal. Run with:

    python tools/gui.py

Each action shells out to the real script with the selected book folder as
its working directory, exactly as the README's manual `cd book && python
../tools/x.py` instructions describe, and streams the script's output (and
any confirmation prompts) into the log pane.
"""

import json
import os
import queue
import re
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(TOOLS_DIR)
API_DIR = os.path.join(TOOLS_DIR, "api")


def resolve_python():
    """Prefer the tools/.venv interpreter if one exists, else the running interpreter."""
    if os.name == "nt":
        candidate = os.path.join(TOOLS_DIR, ".venv", "Scripts", "python.exe")
    else:
        candidate = os.path.join(TOOLS_DIR, ".venv", "bin", "python")
    return candidate if os.path.isfile(candidate) else sys.executable


PYTHON_EXE = resolve_python()


def discover_books():
    """Sibling directories of tools/ that contain a config.json."""
    books = []
    for name in sorted(os.listdir(ROOT_DIR)):
        path = os.path.join(ROOT_DIR, name)
        if os.path.isdir(path) and os.path.isfile(os.path.join(path, "config.json")):
            books.append(path)
    return books


def list_chapters(book_dir):
    bases = []
    for name in os.listdir(book_dir):
        match = re.fullmatch(r"(\d+)\.md", name, re.IGNORECASE)
        if match:
            bases.append(match.group(1))
    return sorted(bases, key=int)


def list_api_files():
    if not os.path.isdir(API_DIR):
        return []
    return sorted(f for f in os.listdir(API_DIR) if os.path.isfile(os.path.join(API_DIR, f)))


def read_config(book_dir):
    try:
        with open(os.path.join(book_dir, "config.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None


class ToolRunner:
    """Runs one tool subprocess at a time and streams its output through a queue."""

    def __init__(self, on_output, on_done):
        self.process = None
        self.on_output = on_output
        self.on_done = on_done

    def is_running(self):
        return self.process is not None and self.process.poll() is None

    def start(self, script_name, args, cwd):
        if self.is_running():
            raise RuntimeError("A tool is already running.")

        script_path = os.path.join(TOOLS_DIR, script_name)
        argv = [PYTHON_EXE, "-u", script_path] + list(args)
        env = dict(os.environ)
        env["PYTHONIOENCODING"] = "utf-8"

        self.process = subprocess.Popen(
            argv,
            cwd=cwd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=env,
        )
        threading.Thread(target=self._pump, daemon=True).start()

    def _pump(self):
        process = self.process
        try:
            for chunk in iter(lambda: process.stdout.read(1), ""):
                self.on_output(chunk)
        finally:
            process.stdout.close()
            returncode = process.wait()
            self.on_done(returncode)

    def send_input(self, text):
        if self.is_running():
            self.process.stdin.write(text + "\n")
            self.process.stdin.flush()

    def stop(self):
        if self.is_running():
            self.process.terminate()


class App:
    def __init__(self, root):
        self.root = root
        root.title("Availabooks Tools")
        root.geometry("1000x700")

        self.output_queue = queue.Queue()
        self.runner = ToolRunner(self._queue_output, self._queue_done)
        self.run_buttons = []
        self.books_by_label = {}

        self._build_layout()
        self._refresh_books()
        self.root.after(50, self._poll_queue)

    # ---------- layout ----------

    def _build_layout(self):
        top = ttk.Frame(self.root, padding=8)
        top.pack(fill="x")

        ttk.Label(top, text="Book:").pack(side="left")
        self.book_var = tk.StringVar()
        self.book_combo = ttk.Combobox(top, textvariable=self.book_var, state="readonly", width=32)
        self.book_combo.pack(side="left", padx=(4, 8))
        self.book_combo.bind("<<ComboboxSelected>>", lambda e: self._on_book_selected())

        ttk.Button(top, text="Browse…", command=self._browse_book).pack(side="left")
        ttk.Button(top, text="Refresh", command=self._refresh_books).pack(side="left", padx=(4, 0))

        self.info_label = ttk.Label(top, text="", foreground="#555")
        self.info_label.pack(side="left", padx=(16, 0))

        body = ttk.Frame(self.root, padding=(8, 0, 8, 8))
        body.pack(fill="both", expand=True)
        body.columnconfigure(1, weight=1)
        body.rowconfigure(0, weight=1)

        # chapter list
        chapters_frame = ttk.LabelFrame(body, text="Chapters", padding=6)
        chapters_frame.grid(row=0, column=0, sticky="ns", padx=(0, 8))

        self.chapters_list = tk.Listbox(chapters_frame, selectmode="extended", width=8, height=20, exportselection=False)
        self.chapters_list.pack(side="top", fill="y", expand=True)

        chapter_btns = ttk.Frame(chapters_frame)
        chapter_btns.pack(side="top", fill="x", pady=(6, 0))
        ttk.Button(chapter_btns, text="All", command=self._select_all_chapters).pack(side="left", expand=True, fill="x")
        ttk.Button(chapter_btns, text="None", command=self._select_no_chapters).pack(side="left", expand=True, fill="x")

        # action panels
        actions = ttk.Frame(body)
        actions.grid(row=0, column=1, sticky="new")
        actions.columnconfigure(0, weight=1)
        actions.columnconfigure(1, weight=1)

        download_frame = ttk.LabelFrame(actions, text="Download from blog", padding=6)
        download_frame.grid(row=0, column=0, sticky="new", padx=(0, 4), pady=(0, 6))
        self._run_button(download_frame, "Download everything", self._download_all).pack(fill="x")
        self._run_button(download_frame, "Download selected chapter", self._download_chapter).pack(fill="x", pady=(4, 0))

        preview_frame = ttk.LabelFrame(actions, text="Preview locally", padding=6)
        preview_frame.grid(row=0, column=1, sticky="new", padx=(4, 0), pady=(0, 6))
        self._run_button(preview_frame, "Preview selected chapters", self._preview_selected).pack(fill="x")

        publish_frame = ttk.LabelFrame(actions, text="Publish to blog (live)", padding=6)
        publish_frame.grid(row=1, column=0, columnspan=2, sticky="new", pady=(0, 6))
        ttk.Label(publish_frame, text="These post live to the blog — confirm in the log below when asked.",
                  foreground="#a33").pack(anchor="w")
        row = ttk.Frame(publish_frame)
        row.pack(fill="x", pady=(4, 0))
        self._run_button(row, "Publish changed chapters (auto-detect)", self._publish_changed).pack(side="left", expand=True, fill="x")
        self._run_button(row, "Publish selected chapters", self._publish_selected).pack(side="left", expand=True, fill="x")
        self._run_button(row, "Rebuild table of contents only", self._publish_toc).pack(side="left", expand=True, fill="x")

        api_frame = ttk.LabelFrame(actions, text="Publish API module", padding=6)
        api_frame.grid(row=2, column=0, columnspan=2, sticky="new")
        api_row = ttk.Frame(api_frame)
        api_row.pack(fill="x")
        ttk.Label(api_row, text="Version:").pack(side="left")
        self.api_version_var = tk.StringVar(value="dev")
        ttk.Entry(api_row, textvariable=self.api_version_var, width=10).pack(side="left", padx=(4, 12))
        self.api_list = tk.Listbox(api_row, selectmode="extended", height=5, exportselection=False)
        self.api_list.pack(side="left", fill="x", expand=True)
        for name in list_api_files():
            self.api_list.insert("end", name)
        self._run_button(api_frame, "Publish selected API module(s)", self._publish_api).pack(fill="x", pady=(6, 0))

        # log
        log_frame = ttk.LabelFrame(self.root, text="Output", padding=6)
        log_frame.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        self.log_text = scrolledtext.ScrolledText(log_frame, height=14, state="disabled", font=("Consolas", 10))
        self.log_text.pack(fill="both", expand=True)

        input_row = ttk.Frame(log_frame)
        input_row.pack(fill="x", pady=(6, 0))
        ttk.Label(input_row, text="Reply (when a script asks yes/no or similar):").pack(side="left")
        self.stdin_var = tk.StringVar()
        stdin_entry = ttk.Entry(input_row, textvariable=self.stdin_var)
        stdin_entry.pack(side="left", fill="x", expand=True, padx=(6, 6))
        stdin_entry.bind("<Return>", lambda e: self._send_input())
        ttk.Button(input_row, text="Send", command=self._send_input).pack(side="left")
        self.stop_button = ttk.Button(input_row, text="Stop", command=self._stop, state="disabled")
        self.stop_button.pack(side="left", padx=(6, 0))

        self.status_var = tk.StringVar(value="Idle")
        ttk.Label(self.root, textvariable=self.status_var, anchor="w", padding=(8, 2)).pack(fill="x")

    def _run_button(self, parent, text, command):
        button = ttk.Button(parent, text=text, command=command)
        self.run_buttons.append(button)
        return button

    # ---------- book / chapter selection ----------

    def _refresh_books(self):
        books = discover_books()
        self.books_by_label = {os.path.basename(path): path for path in books}
        self.book_combo["values"] = list(self.books_by_label.keys())
        if self.books_by_label and not self.book_var.get():
            self.book_combo.current(0)
            self._on_book_selected()

    def _browse_book(self):
        chosen = filedialog.askdirectory(initialdir=ROOT_DIR, title="Choose a book folder")
        if not chosen:
            return
        label = os.path.basename(chosen)
        self.books_by_label[label] = chosen
        self.book_combo["values"] = list(self.books_by_label.keys())
        self.book_var.set(label)
        self._on_book_selected()

    def _current_book_dir(self):
        label = self.book_var.get()
        return self.books_by_label.get(label)

    def _on_book_selected(self):
        book_dir = self._current_book_dir()
        if not book_dir:
            return
        self.chapters_list.delete(0, "end")
        for chapter in list_chapters(book_dir):
            self.chapters_list.insert("end", chapter)

        config = read_config(book_dir)
        if config:
            self.info_label.config(text=f"{config.get('title', '?')}  ({config.get('blogUrl', '?')})")
        else:
            self.info_label.config(text="(could not read config.json)")

    def _select_all_chapters(self):
        self.chapters_list.selection_set(0, "end")

    def _select_no_chapters(self):
        self.chapters_list.selection_clear(0, "end")

    def _selected_chapters(self):
        return [self.chapters_list.get(i) for i in self.chapters_list.curselection()]

    # ---------- guarded book_dir accessor ----------

    def _require_book(self):
        book_dir = self._current_book_dir()
        if not book_dir:
            messagebox.showwarning("No book selected", "Choose a book folder first.")
            return None
        return book_dir

    # ---------- actions ----------

    def _download_all(self):
        book_dir = self._require_book()
        if book_dir:
            self._run("download.py", [], book_dir, "Downloading everything")

    def _download_chapter(self):
        book_dir = self._require_book()
        if not book_dir:
            return
        chapters = self._selected_chapters()
        if len(chapters) != 1:
            messagebox.showwarning("Select one chapter", "Select exactly one chapter to download.")
            return
        self._run("download.py", chapters, book_dir, f"Downloading chapter {chapters[0]}")

    def _preview_selected(self):
        book_dir = self._require_book()
        if not book_dir:
            return
        chapters = self._selected_chapters()
        if not chapters:
            messagebox.showwarning("Select chapters", "Select one or more chapters to preview.")
            return
        self._run("preview.py", chapters, book_dir, f"Previewing chapters {', '.join(chapters)}")

    def _publish_changed(self):
        book_dir = self._require_book()
        if book_dir:
            self._run("publish.py", [], book_dir, "Publishing changed chapters")

    def _publish_selected(self):
        book_dir = self._require_book()
        if not book_dir:
            return
        chapters = self._selected_chapters()
        if not chapters:
            messagebox.showwarning("Select chapters", "Select one or more chapters to publish.")
            return
        self._run("publish.py", chapters, book_dir, f"Publishing chapters {', '.join(chapters)}")

    def _publish_toc(self):
        book_dir = self._require_book()
        if book_dir:
            self._run("publish.py", ["toc"], book_dir, "Rebuilding table of contents")

    def _publish_api(self):
        book_dir = self._require_book()
        if not book_dir:
            return
        selected = [self.api_list.get(i) for i in self.api_list.curselection()]
        if not selected:
            messagebox.showwarning("Select module(s)", "Select one or more API files to publish.")
            return
        version = self.api_version_var.get().strip() or "dev"
        self._run("publish-api.py", [version] + selected, book_dir, f"Publishing API module(s): {', '.join(selected)}")

    # ---------- process plumbing ----------

    def _run(self, script_name, args, cwd, description):
        if self.runner.is_running():
            messagebox.showwarning("Busy", "Another tool is already running. Wait for it to finish.")
            return
        self._clear_log()
        self._append_log(f"$ (in {cwd}) {os.path.basename(script_name)} {' '.join(args)}\n\n")
        self.status_var.set(f"Running: {description}")
        for button in self.run_buttons:
            button.config(state="disabled")
        self.stop_button.config(state="normal")
        try:
            self.runner.start(script_name, args, cwd)
        except RuntimeError as error:
            messagebox.showerror("Error", str(error))
            self._reset_controls()

    def _send_input(self):
        text = self.stdin_var.get()
        if not self.runner.is_running():
            return
        self.runner.send_input(text)
        self._append_log(text + "\n")
        self.stdin_var.set("")

    def _stop(self):
        self.runner.stop()
        self.status_var.set("Stopping…")

    def _reset_controls(self):
        for button in self.run_buttons:
            button.config(state="normal")
        self.stop_button.config(state="disabled")

    def _queue_output(self, chunk):
        self.output_queue.put(("chunk", chunk))

    def _queue_done(self, returncode):
        self.output_queue.put(("done", returncode))

    def _poll_queue(self):
        chunks = []
        done_code = None
        try:
            while True:
                kind, payload = self.output_queue.get_nowait()
                if kind == "chunk":
                    chunks.append(payload)
                else:
                    done_code = payload
        except queue.Empty:
            pass
        if chunks:
            self._append_log("".join(chunks))
        if done_code is not None:
            self._append_log(f"\n\n[finished, exit code {done_code}]\n")
            self.status_var.set("Idle")
            self._reset_controls()
        self.root.after(50, self._poll_queue)

    # ---------- log helpers ----------

    def _append_log(self, text):
        self.log_text.configure(state="normal")
        self.log_text.insert("end", text)
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _clear_log(self):
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", "end")
        self.log_text.configure(state="disabled")


def main():
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
