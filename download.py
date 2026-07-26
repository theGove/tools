import sys
import requests
import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse


from utils import getJsonFile

#   get's the current copy of the blog posts to serve as the local skeleton for the working copy of the book.
#   Be in the root of the book to publish and run
#   python ../tools/download.py
#
#   pass a chapter number to only refetch that chapter's file
#   python ../tools/download.py 3



def download(chapter=None):
    config =  getJsonFile('config.json')
    if config=="failed":
        return
    print("config",config)

    if chapter is not None:
        downloadChapter(config, chapter)
        return

    # get the toc
    urlPrefix="http://"+config['blogUrl']+"/2000/02/"
    url = urlPrefix + "toc.html"
    print(url)
    toc = saveOnePage(url)

    # fetch all pages from toc
    doc = BeautifulSoup(toc, 'html.parser')
    element = doc.find("div", class_="book-chapters")
    print(element)
    for a in element.find_all('a'):
      url = a['href']
      print (url)
      saveOnePage(urlPrefix + url)

    #fetch all feeds files
    url="http://"+config['blogUrl']+"/feeds/posts/default/-/data?alt=json"
    saveDataFiles(url)


def downloadChapter(config, chapter):
    # the chapter number is only ever used as a label on the chapter's own post,
    # so a label search is guaranteed to return exactly that one post.
    labelUrl = "http://"+config['blogUrl']+"/feeds/posts/default/-/"+str(chapter)+"?alt=json&max-results=1"
    print(labelUrl)
    response = requests.get(labelUrl).json()
    entries = response['feed'].get('entry', [])
    if not entries:
        print("No post found labeled", chapter)
        return
    url = next(l['href'] for l in entries[0]['link'] if l['rel'] == 'alternate')
    print(url)
    saveOnePage(url)

def saveDataFiles(url):
    os.makedirs(os.path.join("local","feeds"), exist_ok=True)
    while url:
        response = requests.get(url).json()
        feed = response['feed']

        for entry in feed.get('entry', []):
            label =  entry.get('category')[0]["term"]
            if label=="data":
                label =  entry.get('category')[1]["term"]
            print("Saving data file:",label)
            feedToSave = json.loads(json.dumps(response))
            feedToSave['feed']['entry']=[entry]
            content = entry.get('content', {}).get('$t', '')
            filepath = os.path.join("local","feeds", label + ".json")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(json.dumps(feedToSave))
        url = next((l['href'] for l in feed.get('link', []) if l['rel'] == 'next'), None)


def saveOnePage(url):
    page = requests.get(url).text
    filename = os.path.basename(urlparse(url).path)
    with open(os.path.join("local",filename), 'w', encoding='utf-8') as f:
        f.write(page)
    return page    


def main():
    chapter = sys.argv[1] if len(sys.argv) > 1 else None
    download(chapter)
if __name__=="__main__":
    main()