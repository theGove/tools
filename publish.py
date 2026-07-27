import json
import os
import pprint
import re
import sys

import requests
from bs4 import BeautifulSoup

from utils import chapter_base_name
from utils import existing_chapter_md_path
from utils import is_numeric_chapter_base
from utils import fetch_chapter_feed_entries
from utils import getJsonFile
from utils import getTitle
from utils import html_content_equals
from utils import list_numeric_chapter_bases
from utils import load_chapter_html_and_title
from utils import local_chapter_html
from utils import local_chapter_source_html
from utils import remote_html_by_chapter
from utils import terminal_bold

#   parse the markdown file, convert to html and publish it to the blog
#    Be in the root of the book to publish and run
#   python ../tools/publish.py 1 2
#   where 1 refers to 1.md, the chapter to publish and 2 refers to 2.md, the next chapter to publish.  You can publish as many chapters as you want in one go by listing them all in the command.  Just make sure to list them in order so that the numbering of the chapters is correct on the blog.
#
#   After chapters publish successfully, the table of contents (toc) post is rebuilt
#   automatically from local chapter markdown. To rebuild the TOC alone:
#   python ../tools/publish.py toc


def read_deployment_id():
    """Read the Apps Script deployment id from tools/deploymentId.txt."""
    raw_path = os.path.join(os.path.dirname(__file__), "..", "tools", "deploymentId.txt")
    file_path = os.path.abspath(raw_path)
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read().strip()


def post_to_publish_api(payload):
    """
    POST a publish payload to the Apps Script deployment and print the result.
    @param {dict} payload - Body sent to the publish endpoint (mode, content, ids, …).
    """
    deployment_id = read_deployment_id()
    url = "https://script.google.com/macros/s/" + deployment_id + "/exec"
    response = requests.post(url, json=payload).json()
    if "error" in response:
        print("============================== Update Failed ==============================")
        pprint.pprint(response, indent=4, sort_dicts=False)
        return False
    print("Success.")
    return True


def process(file_name):
    """
    Convert one chapter markdown file to HTML and publish it to the blog.
    @param {string} file_name - Chapter id without extension (e.g. '1').
    """
    html, title = load_chapter_html_and_title(file_name)
    blog_id, post_id = getIdsFromFeed(file_name)

    payload = {
        "mode": "publish",
        "title": title,
        "content": html,
        "blogId": blog_id,
        "postId": post_id,
    }

    print("Updating")
    print("    title:", title)
    print("  Blog ID:", blog_id)
    print("  Post ID:", post_id)

    return post_to_publish_api(payload)


def getIdsFromFeed(file_name):
    """
    Resolve blog and post ids for a labeled post whose HTML slug matches file_name.
    @param {string} file_name - Label / slug without .html (e.g. '1' or 'toc').
    """
    print("Getting blog and post IDs from feed...")
    config = getJsonFile("config.json")
    if config == "failed":
        print("Failed to get configuration")
        sys.exit()

    url = (
        "http://"
        + config["blogUrl"]
        + "/feeds/posts/default/-/"
        + file_name
        + "?alt=json"
    )
    blog_data = requests.get(url).json()
    for item in blog_data["feed"]["entry"]:
        for link in item["link"]:
            filename = link["href"].split("/").pop()
            if filename == file_name + ".html":
                entry_id = item["id"]["$t"]
                blog_id = entry_id.split("blog-")[1]
                post_id = blog_id.split(".post-")[1]
                blog_id = blog_id.split(".post-")[0]
                return blog_id, post_id


def chapter_title_for_toc(html, chapter_base):
    """
    Chapter display title for the TOC (without the leading 'N. ' blog title prefix).
    @param {string} html - Generated chapter HTML.
    @param {string} chapter_base - Chapter id without extension.
    """
    full_title = getTitle(html, chapter_base)
    prefix = chapter_base + ". "
    if full_title.startswith(prefix):
        full_title = full_title[len(prefix) :]
    return re.sub(r"\s+", " ", full_title).strip()


def sections_from_chapter_html(html):
    """
    Collect h2 headings as TOC section entries.
    @param {string} html - Generated chapter HTML.
    """
    document = BeautifulSoup(html, "html.parser")
    sections = []
    for heading in document.find_all("h2"):
        heading_id = heading.get("id")
        if not heading_id:
            continue
        text = re.sub(r"\s+", " ", heading.get_text()).strip()
        sections.append({"text": text, "id": heading_id})
    return sections


def build_toc_html(book_info, chapters):
    """
    Build the toc post HTML (visible book title, author and chapter list).
    @param {dict} book_info - Parsed config.json from the book's home directory.
    @param {list<dict>} chapters - TOC chapter objects with label, id, text, sections.
    """
    authors = book_info.get("authors") or []
    author_line = " and ".join(authors)
    lines = [
        f'<div class="book-title">{book_info.get("title", "")}</div>',
        f'<div class="book-author">{author_line}</div>',
        '<div class="book-toc">',
        '<div class="book-chapters">',
    ]
    for chapter in chapters:
        lines.append(
            f'<div class="book-chapter">{chapter["label"]}:'
            f'<a href="{chapter["id"]}.html">{chapter["text"]}</a></div>'
        )
    lines.append("</div></div>")
    return "\n".join(lines)


def build_book_json(book_info, chapters):
    """
    Build the pure-JSON content for the book post (bookInfo + chapters TOC data).
    @param {dict} book_info - Parsed config.json from the book's home directory.
    @param {list<dict>} chapters - TOC chapter objects with label, id, text, sections.
    """
    book_info["chapters"]=chapters
    #data = {"chapters": chapters, "bookInfo": book_info}
    return json.dumps(book_info, indent=2, ensure_ascii=False)


def update_toc():
    """
    Rebuild the blog TOC from local chapter markdown and publish the toc post.
    """
    config = getJsonFile("config.json")
    if config == "failed":
        print("Failed to get configuration")
        sys.exit(1)

    print("\nUpdating table of contents...")
    chapter_label = config.get("chapterLabel") or "Chapter"

    chapter_bases = list_numeric_chapter_bases()
    if not chapter_bases:
        print("No numeric chapter .md files found — TOC not updated.")
        return False

    chapters = []
    for base in chapter_bases:
        html = local_chapter_source_html(base)
        chapters.append(
            {
                "label": f"{chapter_label} {base}",
                "id": base,
                "text": chapter_title_for_toc(html, base),
                "sections": sections_from_chapter_html(html),
            }
        )

    toc_html = build_toc_html(config, chapters)
    blog_id, post_id = getIdsFromFeed("toc")
    if not blog_id or not post_id:
        print("Could not resolve toc post ids — TOC not updated.")
        return False

    print("Updating TOC")
    print("  Blog ID:", blog_id)
    print("  Post ID:", post_id)
    print(f"  Chapters: {len(chapters)}")

    toc_updated = post_to_publish_api(
        {
            "mode": "publish",
            "content": toc_html,
            "blogId": blog_id,
            "postId": post_id,
        }
    )

    book_json = build_book_json(config, chapters)
    book_blog_id, book_post_id = getIdsFromFeed("book")
    if not book_blog_id or not book_post_id:
        print("Could not resolve book post ids — book post not updated.")
        return toc_updated

    print("Updating book")
    print("  Blog ID:", book_blog_id)
    print("  Post ID:", book_post_id)

    book_updated = post_to_publish_api(
        {
            "mode": "publish",
            "content": book_json,
            "blogId": book_blog_id,
            "postId": book_post_id,
        }
    )

    return toc_updated and book_updated


def changed_chapters(chapter_bases, remote_by_chapter):
    """
    Return chapter ids whose generated HTML differs from the blog feed.
    @param {list<string>} chapter_bases - Local chapter ids to check.
    @param {dict<string, string>} remote_by_chapter - Published HTML keyed by chapter id.
    """
    changed = []
    for base in chapter_bases:
        local_html = local_chapter_html(base)
        remote_html = remote_by_chapter.get(base)
        if remote_html is None:
            print(f"  {base}: not on blog — will publish")
            changed.append(base)
            continue
        if html_content_equals(local_html, remote_html):
            print(f"  {base}: unchanged — skip")
        else:
            print(f"  {base}: content changed — will publish")
            changed.append(base)
    return changed


def discover_changed_chapters():
    """
    Pull the chapter feed and return local chapter ids that differ from the blog.
    """
    config = getJsonFile("config.json")
    if config == "failed":
        print("Failed to get configuration")
        sys.exit(1)

    print("Fetching chapter feed from blog...")
    entries = fetch_chapter_feed_entries(config["blogUrl"])
    remote_by_chapter = remote_html_by_chapter(entries)

    chapter_bases = list_numeric_chapter_bases()
    if not chapter_bases:
        print("No numeric chapter .md files found.")
        return []

    print("Comparing local markdown to published HTML...")
    return changed_chapters(chapter_bases, remote_by_chapter)


def chapters_from_argv(argv):
    """Collect chapter ids from CLI args, in order, skipping missing or non-chapter files."""
    chapters = []
    for arg in argv[1:]:
        if not is_numeric_chapter_base(chapter_base_name(arg)):
            continue
        base = existing_chapter_md_path(arg)
        if base is None:
            continue
        chapters.append(base)
    return chapters


def is_shell_glob_star(argv):
    """True when the shell expanded a glob (e.g. *) — args include .md filenames."""
    return any(os.path.basename(arg).lower().endswith(".md") for arg in argv[1:])


def confirm_publish(chapters, bulk_glob=False):
    """
    Ask the user to confirm before publishing the listed chapters.
    @param {list<string>} chapters - Chapter ids that will be published.
    @param {boolean} [bulk_glob] - True when the shell expanded a glob (e.g. publish.py *).
    """
    n = len(chapters)
    chapter_list = ", ".join(chapters)
    print()
    if n > 1:
        print(terminal_bold("Bulk publish warning"))
        print()
        if bulk_glob:
            print(
                f"You're about to publish {n} chapters in one run (shell glob, e.g. publish.py *)."
            )
        else:
            print(f"You're about to publish {n} chapters in one run.")
        print(
            "Each chapter calls the blog publish API — only do this if you really mean to"
        )
        print("update the whole book. That endpoint is not meant for heavy or repeated use.")
        print()
    print(f"Will publish {n} chapter(s): {chapter_list}")
    print("The table of contents will be rebuilt afterward.")
    print()
    answer = input("Type 'yes' to continue: ").strip().lower()
    if answer != "yes":
        print("Aborted — no chapters published.")
        sys.exit(0)
    print()


def filter_to_changed(chapters):
    """
    When chapters were named on the CLI, still skip any whose HTML matches the feed.
    @param {list<string>} chapters - Chapter ids the user asked to publish.
    """
    config = getJsonFile("config.json")
    if config == "failed":
        print("Failed to get configuration")
        sys.exit(1)

    print("Fetching chapter feed to compare content...")
    entries = fetch_chapter_feed_entries(config["blogUrl"])
    remote_by_chapter = remote_html_by_chapter(entries)
    print("Comparing requested chapters to published HTML...")
    return changed_chapters(chapters, remote_by_chapter)


def publish_chapters(chapters, bulk_glob=False):
    """
    Confirm, publish each chapter, then rebuild the TOC.
    @param {list<string>} chapters - Chapter ids to publish.
    @param {boolean} [bulk_glob] - True when the shell expanded a glob.
    """
    confirm_publish(chapters, bulk_glob=bulk_glob)
    published_any = False
    for base in chapters:
        print("\n\n\n")
        if process(base):
            published_any = True
    print("\n\n\n")
    if published_any:
        update_toc()
        print("\n\n\n")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "toc":
        update_toc()
        return

    if len(sys.argv) > 1:
        chapters = chapters_from_argv(sys.argv)
        if not chapters:
            print("No chapters to publish.")
            return
        chapters = filter_to_changed(chapters)
        if not chapters:
            print("Nothing to publish — all requested chapters match the blog.")
            return
        publish_chapters(
            chapters,
            bulk_glob=is_shell_glob_star(sys.argv) and len(chapters) > 1,
        )
    else:
        chapters = discover_changed_chapters()
        if not chapters:
            print("Nothing to publish — all chapters match the blog.")
            return
        publish_chapters(chapters)


if __name__ == "__main__":
    main()
