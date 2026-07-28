from fileinput import filename
import argparse
import requests
import sys
import pprint
import os

from utils import processDocument
from utils import getTitle
from utils import getPreProcessArgs

BLOG_URL = "https://availabooks-system.blogspot.com/"

HELP_EPILOG = """
Publishes API files from tools/api/ to the availabooks-system blog.

Run from the root of the book you are publishing.

Arguments:
  With one argument, it is treated as an API file name and version defaults to "dev".
  With two or more arguments, the first is the version (e.g. dev, stable) and the
  rest are API file names (without path; extension optional if unambiguous).

List multiple APIs in the order you want chapters numbered on the blog.

Examples:
  python ../tools/publish-api.py monaco
  python ../tools/publish-api.py system
  python ../tools/publish-api.py dev system monaco
  python ../tools/publish-api.py stable auth
"""


def process(file_name, version):
    file_name = resolveApiFileName(file_name)
    print("filename", file_name)
    with open(os.path.join("..","tools","api",file_name), 'r', encoding='utf-8') as file:
        file_contents = file.read()

    base_name = os.path.splitext(file_name)[0]
    ids = getIdsFromFeed(base_name, version)

    raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
    file_path = os.path.abspath(raw_path)
    with open(file_path, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/'+deploymentId+'/exec'

    if ids is None:
        answer = input(f"No post found on the availabooks-system blog labeled with both '{base_name}' and '{version}'. Create it? [y/N] ")
        if answer.strip().lower() not in ("y", "yes"):
            print("Aborting.")
            sys.exit(1)

        payload = {'mode': 'make-post',
                   'content':file_contents,
                   'title':base_name,
                   'labels':[base_name, version],
                   'blogId':getBlogId(),
                   'published':getPublishedDateForVersion(version)
                   }

        print("Creating")
        print("    title:",base_name)
        print("   labels:",payload['labels'])
        print("  Blog ID:",payload['blogId'])

        raw_response = requests.post(url, json = payload)
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
               'content':file_contents,
               'blogId':blogId,
               'postId':postId,
               'version':version
               }

    print("Updating")
    print("     file:",file_name)
    print("  Blog ID:",blogId)
    print("  Post ID:",postId)
    print("  Version:",version)

    raw_response = requests.post(url, json = payload)
    print("HTTP status:", raw_response.status_code)
    print("Raw response:", raw_response.text)
    response = raw_response.json()

    if "error" in response:
        print("============================== Update Failed ==============================")
        pprint.pprint(response, indent=4, sort_dicts=False)
    else:
        print("Success.")


def resolveApiFileName(file_name):
    if os.path.splitext(file_name)[1]:
        return file_name

    api_dir = os.path.join("..", "tools", "api")
    matches = [f for f in os.listdir(api_dir) if os.path.splitext(f)[0] == file_name]

    if len(matches) == 0:
        print(f"No file named '{file_name}' found in the api folder.")
        sys.exit(1)
    if len(matches) > 1:
        print(f"More than one file named '{file_name}' found in the api folder ({', '.join(sorted(matches))}). Specify the extension to disambiguate.")
        sys.exit(1)

    return matches[0]


def getBlogId():
    # feed-level id is "tag:blogger.com,1999:blog-<blogId>", independent of any single post
    url = BLOG_URL + "feeds/posts/default?alt=json&max-results=1"
    blogData = requests.get(url).json()
    return blogData["feed"]["id"]["$t"].split("blog-")[1]


def getPublishedDateForVersion(version):
    url = BLOG_URL + "feeds/posts/default/-/" + version + "?alt=json"
    blogData = requests.get(url).json()
    entries = blogData["feed"].get("entry", [])
    if entries:
        return entries[0]["published"]["$t"]

    print(f"'{version}' is not a valid version: no existing posts are labeled with it.")
    sys.exit(1)


def getIdsFromFeed(file_name, version):
    print("Getting blog and post IDs from feed...")

    # fetch the post labeled with both the api name and the version so we can get the blogId and postId
    url = BLOG_URL + "feeds/posts/default/-/" + file_name + "/" + version + "?alt=json"
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
        description="Publish API files to the availabooks-system blog.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=HELP_EPILOG,
    )
    parser.add_argument(
        "args",
        nargs="+",
        metavar="ARG",
        help="API file name(s), optionally preceded by version (dev, stable, ...). "
             "One arg = file name (version defaults to dev); "
             "two or more = version then file names.",
    )
    parsed = parser.parse_args()

    if len(parsed.args) == 1:
        version = "dev"
        file_names = parsed.args
    else:
        version = parsed.args[0]
        file_names = parsed.args[1:]

    for file_name in file_names:
        print("\n\n\n")
        process(file_name, version)
    print("\n\n\n")

if __name__=="__main__":
    main()
