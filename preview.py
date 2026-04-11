import sys
import os

from utils import processDocument
from utils import getTitle

#   parse the markdown file, convert to html and integrate it into the local copy
#   Be in the root of the book to publish and run
#   python ../tools/publish.py 1 
#   where 1 refers to 1.md, the chapter to publish


def process(file_name):

    with open(file_name+".md", 'r', encoding='utf-8') as file:
        file_contents = file.read()

    html = processDocument(file_contents,  file_name)
    title=getTitle(html, file_name)
    

    filePath = os.path.join("local", file_name + ".html")
    print ("Updating...")
    print ("    Title:", title)
    print ("     Path:", filePath)
    # open target file
    try:
        with open(filePath, 'r', encoding='utf-8') as file:
            contents = file.read()
    except FileNotFoundError:
        print("Error: The file 'local/{filename}.html' was not found.")
        return "failed"

    #  inject the body html
    contents = contents.replace("<!--postEnd-->","<!--postBegin-->").split("<!--postBegin-->")
    contents = contents[0] + "<!--postBegin-->" + html + "<!--postEnd-->" + contents[2]
    # inject the title
    titleArray = contents.split("<span id='title'>")    
    titleArray[1] = titleArray[1].replace("</span>",chr(30),1).split(chr(30))[1]
    contents = titleArray[0] + "<span id='title'>" + title + "</span>" + titleArray[1]

    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(contents)
    print ("Success.")

def main():
    if len(sys.argv) > 1:
        for i, file_name in enumerate(sys.argv):
            if i > 0:
                print("\n\n\n")
                process(file_name)            
        print("\n\n\n")
    else:
        print("must provide the name of a markdown file (without the extension).  This is usually a chapter number")

if __name__=="__main__":
    main()        