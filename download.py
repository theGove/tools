import requests
import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse


from utils import getJsonFile

#   get's the current copy of the blog posts to serve as the local skeleton for the working copy of the book.
#   Be in the root of the book to publish and run
#   python ../tools/download.py



def download():
    config =  getJsonFile('config.json')
    if config=="failed":
        return
    print("config",config)

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
    download()
if __name__=="__main__":
    main()        