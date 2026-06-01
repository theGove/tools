import requests
import sys
import pprint
import os

from utils import chapter_base_name
from utils import is_numeric_chapter_base
from utils import fetch_chapter_feed_entries
from utils import getJsonFile
from utils import getTitle
from utils import html_content_equals
from utils import list_numeric_chapter_bases
from utils import local_chapter_html
from utils import processDocument
from utils import remote_html_by_chapter
from utils import terminal_bold

#   parse the markdown file, convert to html and publish it to the blog
#    Be in the root of the book to publish and run
#   python ../tools/publish.py 1 2
#   where 1 refers to 1.md, the chapter to publish and 2 refers to 2.md, the next chapter to publish.  You can publish as many chapters as you want in one go by listing them all in the command.  Just make sure to list them in order so that the numbering of the chapters is correct on the blog.


def process(file_name):

    with open(file_name+".md", 'r', encoding='utf-8') as file:
        file_contents = file.read()

    html = processDocument(file_contents,  file_name)
    title = getTitle(html, file_name)
    blogId, postId = getIdsFromFeed(file_name)

    
    raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
    file_path = os.path.abspath(raw_path)
    with open(file_path, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/'+deploymentId+'/exec'
    payload = {'mode': 'publish',
               'title':title,
               'content':html,
               'blogId':blogId,
               'postId':postId
               }

    print("Updating")
    print("    title:",title)
    print("  Blog ID:",blogId)
    print("  Post ID:",postId)

    response = requests.post(url, json = payload).json()

    if "error" in response:
        print("============================== Update Failed ==============================")
        pprint.pprint(response, indent=4, sort_dicts=False)
    else:
        print("Success.")    


def getIdsFromFeed(file_name):
    print("Getting blog and post IDs from feed...")
    config =  getJsonFile('config.json')
    if config=="failed":
        print("Failed to get configuration")
        sys.exit()

    # fetch post from feed so we can get the blogId and postId
    url="http://"+config['blogUrl']+"/feeds/posts/default/-/" + file_name + "?alt=json"
    # print(url)
    blogData = requests.get(url).json()
    # print(blogData["feed"]["entry"])
    for item in blogData["feed"]["entry"]:
      for link in item["link"]:
        filename = link["href"].split("/").pop()
        if filename ==file_name + ".html":
            id=item["id"]["$t"]
            blogId = id.split("blog-")[1]
            postId = blogId.split(".post-")[1]
            blogId = blogId.split(".post-")[0]
            #print(blogId, postId)
            return blogId, postId


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
        base = chapter_base_name(arg)
        if not is_numeric_chapter_base(base):
            continue
        md_path = base + ".md"
        if not os.path.isfile(md_path):
            print(f"Skipping {arg}: {md_path} not found")
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


def main():
    if len(sys.argv) > 1:
        chapters = chapters_from_argv(sys.argv)
        if not chapters:
            print("No chapters to publish.")
            return
        chapters = filter_to_changed(chapters)
        if not chapters:
            print("Nothing to publish — all requested chapters match the blog.")
            return
        confirm_publish(
            chapters,
            bulk_glob=is_shell_glob_star(sys.argv) and len(chapters) > 1,
        )
        for base in chapters:
            print("\n\n\n")
            process(base)
        print("\n\n\n")
    else:
        chapters = discover_changed_chapters()
        if not chapters:
            print("Nothing to publish — all chapters match the blog.")
            return
        confirm_publish(chapters)
        for base in chapters:
            print("\n\n\n")
            process(base)
        print("\n\n\n")

if __name__=="__main__":
    main()        