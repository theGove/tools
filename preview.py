import sys
import os

from utils import chapter_base_name
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
    # inject the title (match id='title' regardless of other span attributes)
    title_marker = "id='title'>"
    title_parts = contents.split(title_marker, 1)
    if len(title_parts) < 2:
        print("Error: Could not find title span in HTML template.")
        return "failed"
    after_title = title_parts[1].replace("</span>", chr(30), 1).split(chr(30))[1]
    contents = title_parts[0] + title_marker + title + "</span>" + after_title

    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(contents)
    print ("Success.")

def main():
    if len(sys.argv) > 1:
        for i, file_name in enumerate(sys.argv):
            if i > 0:
                base = chapter_base_name(file_name)
                md_path = base + ".md"
                if not os.path.isfile(md_path):
                    print(f"Skipping {file_name}: {md_path} not found")
                    continue
                print("\n\n\n")
                process(base)
        print("\n\n\n")
    else:
        print("must provide chapter name(s), e.g. 1 or 1.md (shell glob * is fine)")

if __name__=="__main__":
    main()        