import pypandoc
import requests
import sys
import pprint
import json
import os

#   Be in the root of the book to publish and run
#   python ../tools/publish.py 1 
#   where 1 refers to 1.md, the chapter to publish


def publish(file_name,file_contents):
    config = ""
    try:
        with open('config.json', 'r') as file:
            config = json.load(file)  # 'data' is now a Python dictionary or list

        # print("File data:", config)
        # print("Data type:", type(config))

        # You can now access the data like any other Python dictionary/list
        print("Name:", config['blogUrl'])

    except FileNotFoundError:
        print("Error: The file 'data.json' was not found.")
        return
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the file (invalid JSON format).")
        return
    
    print("config",config)
    url="http://"+config['blogUrl']+"/feeds/posts/default/-/chapter?alt=json"
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
            print(blogId, postId)


    output = pypandoc.convert_text(file_contents, 'html', format='md')

    raw_path = os.path.join(os.path.dirname(__file__), '..', 'tools', 'deploymentId.txt')
    file_path = os.path.abspath(raw_path)
    with open(file_path, 'r') as f:
        deploymentId = f.read()

    url = 'https://script.google.com/macros/s/'+deploymentId+'/exec'
    payload = {'mode': 'publish',
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