import pypandoc
import requests
import sys
import pprint
import json
import os
import webbrowser
from bs4 import BeautifulSoup
import yaml

from utils import getJsonFile

#   parse the markdown file, convert to html and publish it to the blog
#    Be in the root of the book to publish and run
#   python ../tools/publish.py 1 
#   where 1 refers to 1.md, the chapter to publish


def publish(file_name,file_contents):
    if file_contents.strip()[:3] == "---":
        # there is a yaml block at top of file
        # check to see if there are any params here for the pre-process (ones that beginning with _$_)
        args = yaml.safe_load(file_contents.split("---")[1])
        preProcessArgs = {}
        for key, value in args.items():
            if key[:3] == "_$_":
                # this is a pre-process param, keep it
                preProcessArgs[key[3:]] = value
    #print(preProcessArgs)            
            
    
    # get the configuration soo we can ask for the feed to get the blogId and postId
    config =  getJsonFile('config.json')
    if config=="failed":
        return
    #print("config",config)
    url="http://"+config['blogUrl']+"/feeds/posts/default/-/" + file_name + "?alt=json"
    print(url)
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

    output = pypandoc.convert_text(file_contents, 'html', format='md',extra_args=['-N','--number-offset='+str(int(file_name)-1)])
    doc = BeautifulSoup(output, 'html.parser')    

    # read the title off the first H1 element
    title=file_name + ". " + doc.find("h1").get_text().replace(" ", chr(30), 1).split(chr(30))[1]
    
    #print(title)

    # add imports at top of html file
    if "import" in preProcessArgs:
        importHtml = []
        for oneImport in preProcessArgs["import"].split(","):
            importHtml.append('<div class="module">' + oneImport.strip() + '</div>')
        output = "\n".join(importHtml) + "\n" + output    
    

    raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
    file_path = os.path.abspath(raw_path)
    with open(file_path, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/'+deploymentId+'/exec'
    payload = {'mode': 'publish',
               'title':title,
               'content':output,
               'blogId':blogId,
               'postId':postId
               }

    print("Updating")
    print("  Blog ID:",blogId)
    print("  Post ID:",postId)

    response = requests.post(url, json = payload).json()

    if "error" in response:
        print("============================== Update Failed ==============================")
        pprint.pprint(response, indent=4, sort_dicts=False)
    else:
        print("Success.")    


def main():
    if len(sys.argv) > 1:
        
        file_name =  sys.argv[1] 
        if file_name == "toc":
            config =  getJsonFile('config.json')
            raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
            file_path = os.path.abspath(raw_path)            
            with open(file_path, 'r') as f:
                deploymentId = f.read()
            url = "http://"+config['blogUrl']+'/1970/01/build-toc.html?deploymentId=' + deploymentId
            webbrowser.open(url)            
        else:    
            print(f"The first argument is: {file_name}")
            try:
                with open(file_name+".md", 'r', encoding='utf-8') as file:
                    file_contents = file.read()
                
            except FileNotFoundError:
                print("Error: The file not found:". file_name+".md")
            except Exception as e:
                print(f"An error occurred: {e}")        
            publish(file_name,file_contents)
    else:
        print("must provide the name of a markdown file (without the extension).")

if __name__=="__main__":
    main()        