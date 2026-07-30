import argparse
import os
import pprint
import sys

import requests

BLOG_URL = "https://system.availabooks.com/"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYSTEM_PAGES_DIR = os.path.join(SCRIPT_DIR, "system-pages")
DEPLOYMENT_ID_PATH = os.path.join(SCRIPT_DIR, "deploymentId.txt")

HELP_EPILOG = """
Publishes system page files from tools/system-pages/ to the availabooks-system blog.

Each post is labeled with "page" and the file name (without ".html").

Can be run from anywhere; file names are resolved relative to tools/system-pages/.

Examples:
  python tools/publish-system-pages.py login
  python tools/publish-system-pages.py login auth
"""


def process(file_name):
    file_name = resolveSystemPageFileName(file_name)
    print("filename", file_name)
    with open(os.path.join(SYSTEM_PAGES_DIR, file_name), 'r', encoding='utf-8') as file:
        file_contents = file.read()

    base_name = os.path.splitext(file_name)[0]
    ids = getIdsFromFeed(base_name)

    with open(DEPLOYMENT_ID_PATH, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/' + deploymentId + '/exec'

    if ids is None:
        answer = input(f"No post found on the availabooks-system blog labeled with both 'page' and '{base_name}'. Create it? [y/N] ")
        if answer.strip().lower() not in ("y", "yes"):
            print("Aborting.")
            sys.exit(1)

        payload = {'mode': 'make-post',
                   'content': file_contents,
                   'title': base_name,
                   'labels': ['page', base_name],
                   'blogId': getBlogId(),
                   }

        print("Creating")
        print("    title:", base_name)
        print("   labels:", payload['labels'])
        print("  Blog ID:", payload['blogId'])

        raw_response = requests.post(url, json=payload)
        print("HTTP status:", raw_response.status_code)
        print("Raw response:", raw_response.text)
        response = raw_response.json()

        if "error" in response:
            print("============================== Create Failed ==============================")
            pprint.pprint(response, indent=4, sort_dicts=False)
        else:
            print("Success.")
        return

    blogId, postId = ids
    payload = {'mode': 'publish',
               'content': file_contents,
               'blogId': blogId,
               'postId': postId,
               }

    print("Updating")
    print("     file:", file_name)
    print("  Blog ID:", blogId)
    print("  Post ID:", postId)

    raw_response = requests.post(url, json=payload)
    print("HTTP status:", raw_response.status_code)
    print("Raw response:", raw_response.text)
    response = raw_response.json()

    if "error" in response:
        print("============================== Update Failed ==============================")
        pprint.pprint(response, indent=4, sort_dicts=False)
    else:
        print("Success.")


def resolveSystemPageFileName(file_name):
    if os.path.splitext(file_name)[1]:
        return file_name

    matches = [f for f in os.listdir(SYSTEM_PAGES_DIR) if os.path.splitext(f)[0] == file_name]

    if len(matches) == 0:
        print(f"No file named '{file_name}' found in tools/system-pages.")
        sys.exit(1)
    if len(matches) > 1:
        print(f"More than one file named '{file_name}' found in tools/system-pages ({', '.join(sorted(matches))}). Specify the extension to disambiguate.")
        sys.exit(1)

    return matches[0]


def getBlogId():
    # feed-level id is "tag:blogger.com,1999:blog-<blogId>", independent of any single post
    url = BLOG_URL + "feeds/posts/default?alt=json&max-results=1"
    blogData = requests.get(url).json()
    return blogData["feed"]["id"]["$t"].split("blog-")[1]


def getIdsFromFeed(base_name):
    print("Getting blog and post IDs from feed...")

    # fetch the post labeled with both "page" and the file's base name so we can get the blogId and postId
    url = BLOG_URL + "feeds/posts/default/-/page/" + base_name + "?alt=json"
    print(url)
    blogData = requests.get(url).json()
    entries = blogData["feed"].get("entry")
    if not entries:
        return None

    blogId = blogData["feed"].get("id").get("$t").split("-")[1]
    postId = entries[0].get("id").get("$t").split("-").pop()
    return blogId, postId


def main():
    parser = argparse.ArgumentParser(
        description="Publish system page files to the availabooks-system blog.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=HELP_EPILOG,
    )
    parser.add_argument(
        "file_names",
        nargs="+",
        metavar="FILE",
        help="System page file name(s) from tools/system-pages/ (extension optional if unambiguous).",
    )
    parsed = parser.parse_args()

    for file_name in parsed.file_names:
        print("\n\n\n")
        process(file_name)
    print("\n\n\n")


if __name__ == "__main__":
    main()
