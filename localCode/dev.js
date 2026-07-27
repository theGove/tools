function runLocalCode(){
    console.log("running Local Code")
    // get the local copy of the css so we can see changes without publishing it
    fetch(`${location.origin}/tools/api/css.css`).then(response => {
        return response.text(); 
        }).then(code => {
            //console.log("code", code)
          document.getElementById('dynamic-css').textContent=code
        })	    
    // get the table of contents from the published blog.  May need to save a local copy 
    // at some time, but for now, just pull from blog        

    fetch(`../config.json`).then(response => {
        return response.json(); 
        }).then(bookInfo => {
            console.log("bookInfo", bookInfo)
          //document.getElementById('dynamic-css').textContent=code
          const feedUrl = `https://${bookInfo.blogUrl}/feeds/posts/default/-/book?alt=json-in-script&max-results=1&callback=initialize`
          console.log("feedUrl",feedUrl)
          loadCrossOrigin(feedUrl)        
        })	    
}
runLocalCode()