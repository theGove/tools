import json
import pypandoc
import json
import yaml
from bs4 import BeautifulSoup


def getTitle(html, file_name):
    doc = BeautifulSoup(html, 'html.parser')    
    # read the title off the first H1 element
    return file_name + ". " + doc.find("h1").get_text().replace(" ", chr(30), 1).split(chr(30))[1]
    

def getJsonFile(filePath):
    try:
        with open(filePath, 'r') as file:
            return json.load(file)  # 'data' is now a Python dictionary or list
    except FileNotFoundError:
        print("Error: The file 'data.json' was not found.")
        return "failed"
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the file (invalid JSON format).")
        return "failed"
    

def processDocument(file_contents,  file_name):
    preProcessArgs =  getPreProcessArgs(file_contents)
    output = pypandoc.convert_text(file_contents, 'html', format='md',extra_args=['-N','--number-offset='+str(int(file_name)-1)])

    # add imports at top of html file
    if "import" in preProcessArgs:
        importHtml = []
        for oneImport in preProcessArgs["import"].split(","):
            importHtml.append('<div class="module">' + oneImport.strip() + '</div>')
        output = "\n".join(importHtml) + "\n" + output    
    return output

def getPreProcessArgs(file_contents):
    if file_contents.strip()[:3] == "---":
        # there is a yaml block at top of file
        # check to see if there are any params here for the pre-process (ones that beginning with _$_)
        args = yaml.safe_load(file_contents.split("---")[1])
        preProcessArgs = {}
        for key, value in args.items():
            if key[:3] == "_$_":
                # this is a pre-process param, keep it
                preProcessArgs[key[3:]] = value
        
        return preProcessArgs        
    return {}
