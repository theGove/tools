import requests
import sys
import pprint
import os

from utils import chapter_base_name
from utils import processDocument
from utils import getTitle
from utils import getJsonFile

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


def chapters_from_argv(argv):
    """Collect chapter ids from CLI args, in order, skipping missing .md files."""
    chapters = []
    for arg in argv[1:]:
        base = chapter_base_name(arg)
        md_path = base + ".md"
        if not os.path.isfile(md_path):
            print(f"Skipping {arg}: {md_path} not found")
            continue
        chapters.append(base)
    return chapters


def is_shell_glob_star(argv):
    """True when the shell expanded a glob (e.g. *) — args include .md filenames."""
    return any(os.path.basename(arg).lower().endswith(".md") for arg in argv[1:])


def confirm_star_bulk_publish(chapters):
    """Ask the user to confirm publishing many chapters at once (glob * workflow)."""
    n = len(chapters)
    chapter_list = ", ".join(chapters)
    print()
    print("⚠️  Bulk publish warning")
    print()
    print(f"You're about to publish {n} chapters in one run (shell glob, e.g. publish.py *).")
    print("Each chapter calls the blog publish API — only do this if you really mean to")
    print("update the whole book. That endpoint is not meant for heavy or repeated use.")
    print()
    print(f"Chapters: {chapter_list}")
    print()
    answer = input("Type 'yes' to continue: ").strip().lower()
    if answer != "yes":
        print("Aborted — no chapters published.")
        sys.exit(0)
    print()


def main():
    if len(sys.argv) > 1:
        chapters = chapters_from_argv(sys.argv)
        if not chapters:
            print("No chapters to publish.")
            return
        if is_shell_glob_star(sys.argv) and len(chapters) > 1:
            confirm_star_bulk_publish(chapters)
        for base in chapters:
            print("\n\n\n")
            process(base)
        print("\n\n\n")
    else:
        print("must provide chapter name(s), e.g. 1 or 1.md (shell glob * is fine)")

if __name__=="__main__":
    main()        