from fileinput import filename
import requests
import sys
import pprint
import os

from utils import processDocument
from utils import getTitle
from utils import getJsonFile
from utils import getPreProcessArgs

#   Publishes an api file to the current book blog
#    Be in the root of the book to publish and run
#   python ../tools/publish-api.py system monaco
#   where system refers to /tools/api/system.js and monaco is the next api to publish, /tools/api/monaco.js.  You can publish as many apis as you want in one go by listing them all in the command.  Just make sure to list them in order so that the numbering of the chapters is correct on the blog.


def process(file_name):
    if not file_name.endswith(".js"):
        file_name += ".js"    
    print("filename", file_name)
    with open(os.path.join("..","tools","api",file_name), 'r', encoding='utf-8') as file:
        file_contents = file.read()

    blogId, postId = getIdsFromFeed(file_name.removesuffix(".js"))

    raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
    file_path = os.path.abspath(raw_path)
    with open(file_path, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/'+deploymentId+'/exec'
    payload = {'mode': 'publish',
               'content':file_contents,
               'blogId':blogId,
               'postId':postId
               }

    print("Updating")
    print("     file:",file_name)
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


def main():
    if len(sys.argv) > 1:
        for i, file_name in enumerate(sys.argv):
            if i > 0:
                print("\n\n\n")
                process(file_name)            
        print("\n\n\n")
    else:
        print("must provide the name of a api file (without the extension).  This is usually a chapter number")

if __name__=="__main__":
    main()        