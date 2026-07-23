import html
import json
import os
import re
import sys

import pypandoc
import requests
import yaml
from bs4 import BeautifulSoup

_windows_ansi_enabled = False


def _enable_windows_ansi():
    """Enable ANSI escape sequences on Windows consoles (Windows 10+)."""
    global _windows_ansi_enabled
    if _windows_ansi_enabled or os.name != "nt":
        return
    try:
        import ctypes

        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_ulong()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            enable_vt = 0x0004
            if (mode.value & enable_vt) == 0:
                kernel32.SetConsoleMode(handle, mode.value | enable_vt)
        _windows_ansi_enabled = True
    except (AttributeError, OSError):
        pass


def terminal_bold(text):
    """
    Return text wrapped for bold terminal output (Unix and Windows).
    @param {string} text - Plain text to emphasize.
    """
    if not sys.stdout.isatty():
        return text
    if os.name == "nt":
        _enable_windows_ansi()
    return f"\033[1m{text}\033[0m"


def chapter_base_name(arg):
    """Return chapter id (e.g. '1') from '1', '1.md', or a path ending in '.md'."""
    name = os.path.basename(arg)
    if name.lower().endswith(".md"):
        return name[:-3]
    return name


def is_numeric_chapter_base(base):
    """
    True when base names a numbered chapter (e.g. '1'), not examples.md or other files.
    @param {string} base - Chapter id without extension.
    """
    return bool(re.fullmatch(r"\d+", base))


def getTitle(html, file_name):
    doc = BeautifulSoup(html, 'html.parser')    
    # read the title off the first H1 element
    return file_name + ". " + doc.find("h1").get_text().replace(" ", chr(30), 1).split(chr(30))[1]
    

def getJsonFile(filePath):
    try:
        with open(filePath, 'r') as file:
            return json.load(file)  # 'data' is now a Python dictionary or list
    except FileNotFoundError:
        print("Error: The file 'data.json' was not found.")
        return "failed"
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the file (invalid JSON format).")
        return "failed"
    

def processDocument(file_contents,  file_name):
    preProcessArgs =  getPreProcessArgs(file_contents)
    output = pypandoc.convert_text(file_contents, 'html', format='md',extra_args=['-N','--number-offset='+str(int(file_name)-1)])

    # add imports at top of html file
    if "import" in preProcessArgs:
        importHtml = []
        for oneImport in preProcessArgs["import"].split(","):
            importHtml.append('<div class="module">' + oneImport.strip() + '</div>')
        output = "\n".join(importHtml) + "\n" + output    
    return output

def chapter_number_from_entry(entry):
    """
    Return the markdown chapter number from a Blogger feed entry's categories.
    @param {dict} entry - One item from feed entry[].
    """
    for category in entry.get("category", []):
        term = category.get("term", "")
        if re.fullmatch(r"\d+", term):
            return term
    return None


def normalize_html_for_compare(html_text):
    """
    Normalize HTML so local generation can be compared to Blogger feed content.
    @param {string} html_text - Raw HTML string.
    """
    text = html_text.replace("\r\n", "\n").replace("\r", "\n")
    return html.unescape(text).strip()


def html_content_equals(local_html, remote_html):
    """
    True when local and remote chapter HTML match after normalization.
    @param {string} local_html - HTML generated from markdown.
    @param {string} remote_html - content.$t from the chapter feed entry.
    """
    return normalize_html_for_compare(local_html) == normalize_html_for_compare(remote_html)


def fetch_chapter_feed_entries(blog_url):
    """
    Fetch all Blogger posts labeled chapter.
    @param {string} blog_url - Hostname from config, e.g. book1007.blogspot.com.

    Requests a large max-results instead of following the feed's own "next"
    link: for this label-filtered feed, Blogger's self-generated next-page
    URL duplicates the label segment (.../-/chapter/-/chapter?...) and comes
    back with zero entries, silently dropping every chapter past the first
    page (e.g. chapter 1, being the oldest post, lands on page 2).
    """
    url = f"https://{blog_url}/feeds/posts/default/-/chapter?alt=json&max-results=500"
    response = requests.get(url)
    response.raise_for_status()
    feed = response.json()["feed"]
    return feed.get("entry", [])


def remote_html_by_chapter(entries):
    """
    Map chapter number to published HTML from feed entries.
    @param {list} entries - Blogger feed entry objects.
    """
    by_chapter = {}
    for entry in entries:
        chapter_num = chapter_number_from_entry(entry)
        if chapter_num is None:
            continue
        by_chapter[chapter_num] = entry.get("content", {}).get("$t", "")
    return by_chapter


def local_chapter_html(chapter_base):
    """
    Convert a local markdown chapter to HTML (same path publish uses).
    @param {string} chapter_base - Chapter id without extension, e.g. '1'.
    """
    md_path = chapter_base + ".md"
    with open(md_path, "r", encoding="utf-8") as file:
        file_contents = file.read()
    return processDocument(file_contents, chapter_base)


def list_numeric_chapter_bases():
    """Chapter ids for numeric .md files in the current directory, sorted numerically."""
    bases = []
    for name in os.listdir("."):
        if re.fullmatch(r"\d+\.md", name, re.IGNORECASE):
            bases.append(name[:-3])
    return sorted(bases, key=int)


def getPreProcessArgs(file_contents):
    if file_contents.strip()[:3] == "---":
        # there is a yaml block at top of file
        # check to see if there are any params here for the pre-process (ones that beginning with _$_)
        args = yaml.safe_load(file_contents.split("---")[1])
        preProcessArgs = {}
        for key, value in args.items():
            if key[:3] == "_$_":
                # this is a pre-process param, keep it
                preProcessArgs[key[3:]] = value
        
        return preProcessArgs        
    return {}
