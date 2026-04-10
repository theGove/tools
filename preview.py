import pypandoc
import requests
import sys
import pprint
import json
import os
import webbrowser
from bs4 import BeautifulSoup
import yaml

from utils import processDocument
from utils import getTitle

#   parse the markdown file, convert to html and integrate it into the local copy
#   Be in the root of the book to publish and run
#   python ../tools/publish.py 1 
#   where 1 refers to 1.md, the chapter to publish


def publish(file_name,file_contents):
    html = processDocument(file_contents,  file_name)
    title=getTitle(html, file_name)
    
    # print ("html", html[:1000])
    print ("title", title)

    filePath = os.path.join("local", file_name + ".html")
    print("filepath",filePath)
    # open target file
    try:
        with open(filePath, 'r', encoding='utf-8') as file:
            contents = file.read()
    except FileNotFoundError:
        print("Error: The file 'local/{filename}.html' was not found.")
        return "failed"
    print(contents)

    #  inject the body html
    contents = contents.replace("<!--postEnd-->","<!--postBegin-->").split("<!--postBegin-->")
    contents = contents[0] + "<!--postBegin-->" + html + "<!--postEnd-->" + contents[2]
    # inject the title
    titleArray = contents.split("<span id='title'>")    
    titleArray[1] = titleArray[1].replace("</span>",chr(30),1).split(chr(30))[1]
    print(titleArray)
    contents = titleArray[0] + "<span id='title'>" + title + "</span>" + titleArray[1]

    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(contents)

def main():
    if len(sys.argv) > 1:
        
        file_name =  sys.argv[1] 
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