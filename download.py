import requests
import os
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