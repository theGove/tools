const pageData={}
let  variables={}

function searchBook(){
  fetch(`/feeds/posts/default?alt=json&label=chapter&v=2&orderby=relevance&max-results=100&q=label%3Achapter+${encodeURIComponent(tag("search").value)}&start-index=1&rewriteforssl=true`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log(data); 
    tag("search-results").replaceChildren()
    if(data.feed.entry){
      for(entry of data.feed.entry){
        buildChapterSearchResult(entry)
      }
    }else{
      // add no results found message if needed
        const chapterResultDiv = document.createElement("div");
        chapterResultDiv.appendChild(document.createTextNode("No Results Found"))
        tag("search-results").appendChild(chapterResultDiv)
    }

  })
  
}
function findLink(links){
  // takes a set of links from a blogger feed and returns the one with labeled "alternate"
  for(const link of links){
    if(link.rel==='alternate'){
      return link
    }
  }
}
function buildChapterSearchResult(entry){
      console.log(entry)
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML=entry.content.$t
      
      const chapterResultLink = document.createElement("a");
      chapterResultLink.className="chapter-result-link"
      chapterResultLink.href=findLink(entry.link).href.split("/").pop()
      chapterResultLink.style.color="black"
      const chapterResultDiv = document.createElement("div");
      chapterResultDiv.className="search-result"
      const resultTitleDiv = document.createElement("div");
      resultTitleDiv.className = "search-result-title"
      resultTitleDiv.appendChild(document.createTextNode(entry.title.$t))
      chapterResultDiv.appendChild(resultTitleDiv)
      const searchTerm = tag("search").value
      for(const result of findPhraseWithContext(tempDiv.innerText, searchTerm,5)){
      	console.log("result:",result)
        const regex = new RegExp(searchTerm, "gi"); 
        const markedResult =   result.replace(regex, `<span class="search-term">${searchTerm}</span>`);     
        const resultLineDiv = document.createElement("div");
        resultLineDiv.className = "search-result-line"
        resultLineDiv.innerHTML = markedResult
        chapterResultDiv.appendChild(resultLineDiv)
        
      }      
      
      
      chapterResultLink.appendChild(chapterResultDiv)
      tag("search-results").appendChild(chapterResultLink)
      

}

function entryHasLabel(entry, label){
  for(const category of entry.category){
    if(category.term===label){
      return true
    }
  }
  return false
}


function findPhraseWithContext(text, phrase, contextCount = 10) {
  const words = text.split(/\s+/);
  const phraseWords = phrase.toLowerCase().split(/\s+/);
  const results = [];

  for (let i = 0; i <= words.length - phraseWords.length; i++) {
    // Check if the next sequence of words matches the phrase
    let match = true;
    for (let j = 0; j < phraseWords.length; j++) {
      const cleanWord = words[i + j].replace(/[^\w\s]/g, "").toLowerCase();
      if (cleanWord !== phraseWords[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      // Get context: 10 words before the phrase start, 10 words after the phrase end
      const start = Math.max(0, i - contextCount);
      const end = i + phraseWords.length + contextCount;
      
      const snippet = words.slice(start, end).join(" ");
      results.push(snippet);
      
      // Move index forward by phrase length to avoid overlapping sub-matches
      i += phraseWords.length - 1;
    }
  }

  return results;
}

function init(){
    setVariables()
    getToc() 
    configureBook()
    
    // set up searching the full content of book
     tag("search").addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault(); 
        searchBook();
      }
    });
    tag("search-button").addEventListener("click", searchBook)
    
    
    // Set a function onscroll - this will activate if the user scrolls
    //dims the buttons when the user scrolls
    window.onscroll = setDimness

    window.addEventListener('hashchange', function() {
        if(window.location.hash){
            scroll_to(window.location.hash.substring(1))
        } else {
            showSection(1)
        }
        
      });

    window.addEventListener('resize', setTopMargin);
    setTopMargin()
    //console.log("hash", window.location.hash)
    if(window.location.hash){
        scroll_to(window.location.hash.substring(1))
    }else{
        showSection(1)
    }
}

function configureBook(){
    document.body.style.setProperty('--font-zoom', variables.fontZoom);
}

function setVariables(){
    //read the variables from local storage.  if not present create them and save to local storage
    const pathArray = window.location.pathname.split("/")
    variables.year=pathArray[1]
    variables.month=pathArray[2]

    const storedVariables = localStorage.getItem("book-settings")
    if(storedVariables===null){
        // storedVariables do not yet exits
        variables.fontZoom=1
        localStorage.setItem(`book-settings`,JSON.stringify(variables))
    }else{
        variables=JSON.parse(storedVariables)
    }

    //console.log("variables",variables)
    //console.log("storedVariables",storedVariables)
  
}

function setDimness() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    //document.documentElement.scrollTop+document.documentElement.clientHeight,document.documentElement.scrollHeight
    if (scrollTop < 20 || Math.abs((scrollTop + clientHeight)-scrollHeight)<5) {
        dimButtons('bright')
        dimHeader('bright')
    } else {
        dimButtons('dim')
        dimHeader('dim')
    }
    //hideMenu()
}


function setTopMargin(){
     
    const header = document.getElementsByTagName("header")[0]
    if(header){
      const margin = header.offsetHeight 
      for(section of document.querySelectorAll('.chapter-section')){
          section.style.marginTop =  `calc((${margin * 1.1}px  * var(--font-zoom))`
      }
    }

}

function scroll_to(id, recordHash=true){
    // Scroll to the specified element, being sure it is visible
    //console.log("scrollTo", id)
    hideMenu()
    let element = tag(id)
    if(!element){return}
    while (!element.className.includes('chapter-section')) {
        element = element.parentElement;
        if(!element){return}
    }

    showSection(element.id.split('-')[1],false)
    
    if(id !== element.id){
      // this is not a section, scroll to it  
      tag(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if(recordHash){
        window.location.hash = '#' + id
    }

}

function tag(id){
    return document.getElementById(id)
}

function dimButtons(brightOrDim){
    for(const button of document.querySelectorAll('.nav')){
        if(brightOrDim === 'bright'){
            button.classList.remove("dim-button")
        } else {
            // Dim the button
            button.classList.add("dim-button")
        }
    }
}
function dimHeader(brightOrDim){
    for(const header of document.getElementsByTagName("header")){
        if(brightOrDim === 'bright'){
            header.classList.remove("dim-header")
        } else {
            // Dim the button
            header.classList.add("dim-header")
        }
    }
}
function showSection(section, recordHash=true){
    // section can be a number or 'next' or 'prior' or 'all'
    let sectionsToHide = []
    let sectionToShow = 1
    let currentlyShowing = 0
    let buttonNavigatgion = false
    const sections = document.querySelectorAll('.chapter-section')

    if(sections.length === 0){return}

    if(section === 'all'){  // not currently used or tested
        for(const elem of sections){
            elem.style.display = 'block'
        }
        return
    }

    


    // find the section to hide
    for(const elem of sections){
        if(elem.style.display !== 'none'){
            currentlyShowing = parseInt(elem.id.split('-')[1])
            //console.log("currentlyShowing", currentlyShowing)
            sectionsToHide.push(currentlyShowing)
        }
    }

    // find section to show
    if(isNaN(section)){
        // section s string and should be 'next' or 'prior'
        buttonNavigatgion = true
        if(section === 'next'){
            sectionToShow = currentlyShowing + 1
        }else{
            //section === 'prior'
            sectionToShow = currentlyShowing - 1
        }
    }else{
        // section numeric
        sectionToShow = section
    }

    // prevents sectionToShow from being out of bounds
    if (isNaN(sectionToShow)){return}

    if(sectionToShow < 1){

        const components = window.location.pathname.split('/')
        priorChapter = parseInt(components[components.length - 1].split('.')[0]) - 1
        if (priorChapter < 1){
            window.location.href = 'toc.html'
        }else{
            window.location.href = priorChapter + '.html'
            return
        }

    }else if(sectionToShow > sections.length){
        // navigate to next chapter
        // needs to be updated to work with TOC, for now, it will guess the chapter number

        
        if(!pageData.bookend){
            pageData.bookend = tag("page-data").dataset.bookend
            //console.log('tag("page-data").dataset.bookend',tag("page-data").dataset.bookend)
        }
        if(pageData.bookend==="true"){
            message({text:"You have reached the end of this book.  Thank you for using Availabooks.", title:"Book Over", buttons:[], seconds:8})
        }else{
            const components = window.location.pathname.split('/')
            nextChapter = parseInt(components[components.length - 1].split('.')[0]) + 1
            window.location.href = nextChapter + '.html'
        }
        return 
    }

    for(const sectionNumber of sectionsToHide ){
        tag('section-' + sectionNumber).style.display = 'none'
    }

    tag('section-' + sectionToShow).style.display = 'block'  
    
    if(sectionToShow===1){
        window.scrollTo(0,0)
    }else{
        window.scrollTo(0,25)
        if(recordHash){
          window.location.hash = 'section-' + sectionToShow
        }
    }
    
}

function navigate(direction){
    const path= location.pathname.replace(".","/").split("/")

    let nextNumber=null
    if(direction==="prior"){
      nextNumber = parseInt(path[3])-1 
      if (nextNumber<1){
        return// no where to go
      }
    }else{
    nextNumber = parseInt(path[3])+1
      if (nextNumber>window.lastChapterId){
        return// no where to go
      }
    }


    path[3]=nextNumber+"."+path.pop()
    console.log("I'm navigating",path.join("/"))
    window.location.href=path.join("/")

    return
    // assuming full chapter navigation



    // used for the navigation buttons. direction is 'next' or 'prior'
    targetNode = tag(direction + "-button")
    const parentNode = targetNode.parentNode

    const clonedElement = targetNode.cloneNode(true);
    targetNode.remove()

    if(direction === 'next'){
        showSection('next')
    } else{
        // direction === 'prior'
        showSection('prior')
    }
    parentNode.appendChild(clonedElement)
    
}
function showMenu(){
    // show the menu
    //console.log("showing menu")
    
    let menuWidth=tag('menu').offsetWidth

    if (menuWidth === 0){
        tag('menu').style.display = 'block'
        menuWidth=tag('menu').offsetWidth
    }   
    tag('menu').style.left= '0'
    //console.log("menuWidth",menuWidth)
    // if(tag("menu-button").innerHTML === "close"){
    //     tag("menu-button").innerHTML="menu"
    //     tag('menu').style.left= `-${menuWidth+10}px`
    // }else{
    //     tag("menu-button").innerHTML="close"
    //     tag('menu').style.left= '0'
    // }    
    
}

function hideMenu(){
    let menuWidth=tag('menu').offsetWidth
    tag('menu').style.left= `-${menuWidth+10}px`  
      
}

function copyThisPrompt(event){
  console.log("at copyThisPrompt")  
  showToast("I'm juicing!")
  const prior = event.target.previousElementSibling;
  if (!prior) return;

  navigator.clipboard.writeText(prior.innerText)
    .then(() => showToast("prompt for AI copied"))
    .catch(console.error);
}

function getAiHelpPrompt(){
    const text=["I'm currently a student studying this book:"]
    text.push(JSON.stringify(window.availabooksToc))
    text.push(`I'm currently studying chapter ${window.availabooksChapter}.`)
    text.push("as we interact, this gives you a sense for what I've learned and what is coming in my course of study, so you can give me appropriate help.  I'll favor responses that rely heavily on the content I've already covered, but if you do need to refer to something I have not year learned, I prefer that you use ideas that are coming in this course of study. Only refer to content outside of this course of study when absolutely necessary to provide a reasonable answer.  Anytime you are using concepts that I have not already learned, be sure to give me the option for a more detailed explanation.")

    navigator.clipboard.writeText(text.join("\n"))
      .then(() => console.log("Copied!"))
      .catch(err => console.error("Failed:", err));
}

async function getToc(){
    let url=window.location  
    path = url.pathname.split("/")
    path.pop()
    path.push("toc.html")
    path.unshift(url.origin)
    url=path.join("/")

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const text = await response.text();
    const toc=JSON.parse(text.split('<div style="display:none" id="toc-json">')[1].split("</div     >")[0])
    tag("book-title").getElementsByTagName("a")[0].replaceChildren(toc.bookInfo.title)
    window.availabooksToc=toc
    const  html=[] //`<div id="toc-json" style="display:none">${JSON.stringify(toc)}</div>`
    
    for(const chapter of toc.chapters){
        if(chapter.sections){
            let chapterNumber = window.location.pathname.split("/").pop().split(".")[0]
            if(chapterNumber === chapter.id){
                html.push("<details open>")
                window.availabooksChapter=chapterNumber
            }else{
                html.push("<details>")
            }
            getChaptSections(chapter, html)
            html.push("</details>")
        }else{    
          let label=""
          if(chapter.label){
            label=chapter.label + ": "
          }
            html.push(`<div>${label}<a href="${chapter.id}.html">${chapter.text}</a></div>`)
        }        
        window.lastChapterId=parseInt(chapter.id)
    }
    tag("toc").innerHTML=html.join("\n")

}


function getChaptSections(obj, html) { 
        //console.log("at chapterSections",obj)
        let label=""
        if(obj.label){
          label=obj.label + ": "
        }

    html.push("<summary>")
    html.push(`<span>${label}</span><span><a href="${newPathName(window.location.pathname,obj.id)}">${obj.text}</a></span>`)
    html.push("</summary>")
    for(const child of obj.sections){
        if(child.sections){
            html.push('<div class="toc-section-container"><details>')
            getChaptSections(child, html)
            html.push("</details></div>")
        }else{                
            html.push('<div class="toc-text-container">')
            html.push(`<a href="${newPathName(window.location.pathname,obj.id)}#${child.id}"><span></span><span>${child.text}</a></span>`)
            html.push("</div>")
        }

    }
    function lastId(id){
        const idArray=id.split("-")
        return idArray[idArray.length-1]
    }
    function newPathName(path, id){
        const pathArray=path.split("/")        
        const fileArray = pathArray[pathArray.length-1].split(".")
        const currentChapter=fileArray[0]
        //console.log("about to split", id, typeof id)
        const linkChapter = id.split("-").shift()
        
        if(linkChapter===currentChapter){
            // link to a place on the same page
            return ""
        }else{
            //link to a place on a different page
            fileArray[0] = linkChapter
            pathArray[pathArray.length-1] = fileArray.join(".")
            return pathArray.join("/")
        }

        
    }
}


function showHighlight(){

    document.getElementsByTagName("p")[0].replaceChildren(document.getElementsByTagName("p")[0].innerHTML)

}

//==========how to use the messaging system===========
// // Informational, auto-closes after 5 seconds
// message({text:"Saved successfully.", title:"Saved", buttons:[], seconds:5})

// // Warning with Yes/No buttons
// message({text:"Overwrite existing data?", title:"Confirm", type:"warning",
//     buttons:[{text:"Yes", fn:doOverwrite}, {text:"No", fn:closeMessage}]})

// // Critical error, modal (blocks the page until dismissed)
// message({text:"Database connection failed.", title:"Critical Error", type:"error", modal:true,
//     buttons:[{text:"OK", fn:closeMessage}]})

// // Custom buttons, auto-dismiss after 10s, non-blocking
// message({text:"New version available.", title:"Update", seconds:10,
//     buttons:[{text:"Update Now", fn:startUpdate}, {text:"Later", fn:closeMessage}]})





//==========how to use the toast notification system===========
// showToast("Saved.")                  // neutral info
// showToast("Saved successfully.", "success")
// showToast("Save failed.", "error")
function getToastEl(){
    let el = tag("toast")
    if (!el) {
        el = document.createElement("div")
        el.id = "toast"
        el.hidden = true
        document.body.appendChild(el)
    }
    return el
}

function showToast(message, kind) {
    const toastEl = getToastEl();
    toastEl.textContent = message;
    toastEl.className = "toast" + (kind ? " " + kind : "");
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
        toastEl.hidden = true;
    }, 3200);
}

function closeMessage(evt) {
    let dialog
    if (evt && evt.target) {
        let elem = evt.target
        while (elem && !elem.classList.contains("msg-dialog")) elem = elem.parentNode
        dialog = elem
    }
    if (dialog) {
        if (dialog._msgOverlay) dialog._msgOverlay.remove()
        dialog.remove()
    }
}

// message({text, title, buttons, seconds, type, modal})
//   text    : message HTML/text  (default: "An error occurred.")
//   title   : title bar text     (default: "System Message")
//   buttons : [{text, fn}, ...]  — e.g. [{text:"Yes",fn:yesFn},{text:"No",fn:closeMessage}]
//             common labels: "OK", "Cancel", "Yes", "No"  (default: [{text:"OK",fn:closeMessage}])
//   seconds : auto-close delay in seconds (optional)
//   type    : "info" (default) | "warning" | "error"
//   modal   : true = block page interaction until dismissed; false (default) = non-blocking
function message({text: messageHtml = "An error occurred.", title: titleText = "System Message", buttons: callbacks = [{text:"OK", fn:closeMessage}], seconds: secondsUntilClose, type = "info", modal = false} = {}) {

    // ensure gallery container exists
    let galley = tag("msg-galley")
    if (!galley) {
        galley = document.createElement("div")
        galley.id = "msg-galley"
        galley.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:300px;max-width:min(500px,90vw);"
        document.body.appendChild(galley)
    }

    // inject styles once
    if (!tag("msg-styles")) {
        const s = document.createElement("style")
        s.id = "msg-styles"
        s.textContent = `
            #msg-galley { pointer-events:none; }
            .msg-dialog { pointer-events:auto; width:100%; background:#fff;
                          box-shadow:0 4px 24px rgba(0,0,0,0.22); position:relative;
                          overflow:hidden; box-sizing:border-box; }
            .msg-title   { padding:10px 36px 8px 14px; font-weight:600; font-size:14px; color:#fff; }
            .msg-info    .msg-title { background:#2196f3; }
            .msg-warning .msg-title { background:#ff9800; }
            .msg-error   .msg-title { background:#f44336; }
            .msg-message { padding:10px 14px; font-size:13px; color:#333; border-radius:0; }
            .msg-button-bar { display:flex; justify-content:flex-end; gap:8px; padding:8px 14px 12px; }
            .msg-button-bar button { padding:4px 14px; border-radius:4px; border:1px solid #ccc;
                                     cursor:pointer; font-size:13px; background:#f0f0f0; }
            .msg-button-bar button:hover { background:#e0e0e0; }
            .msg-close { position:absolute; top:8px; right:8px; cursor:pointer; color:#000;
                         line-height:1; display:flex; align-items:center;
                         background:#d0d0d0; border:1px solid #000; border-radius:3px; padding:1px 2px; }
            .msg-close:hover { background:#bbb; }
            .msg-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9998; }
        `
        document.head.appendChild(s)
    }

    // modal overlay blocks the rest of the page
    let overlay = null
    if (modal) {
        overlay = document.createElement("div")
        overlay.className = "msg-overlay"
        document.body.appendChild(overlay)
    }

    const dialog = document.createElement("div")
    dialog.className = "msg-dialog msg-" + type
    dialog._msgOverlay = overlay

    // X dismiss button
    const closeBtn = document.createElement("div")
    closeBtn.className = "msg-close"
    const closeIcon = document.createElement("span")
    closeIcon.className = "material-symbols-outlined"
    closeIcon.textContent = "close"
    closeIcon.style.fontSize = "calc(15px * var(--font-zoom, 1))"
    closeBtn.appendChild(closeIcon)
    closeBtn.addEventListener("click", closeMessage)
    dialog.appendChild(closeBtn)

    const titleBar = document.createElement("div")
    titleBar.className = "msg-title"
    titleBar.textContent = titleText
    dialog.appendChild(titleBar)

    const messagePane = document.createElement("div")
    messagePane.className = "msg-message"
    messagePane.innerHTML = messageHtml
    dialog.appendChild(messagePane)

    if (callbacks.length > 0) {
        const buttonBar = document.createElement("div")
        buttonBar.className = "msg-button-bar"
        for (const cb of callbacks) {
            const button = document.createElement("button")
            button.textContent = cb.text
            button.addEventListener("click", cb.fn)
            buttonBar.appendChild(button)
        }
        dialog.appendChild(buttonBar)
    }

    galley.appendChild(dialog)

    if (secondsUntilClose) {
        const timeoutId = setTimeout(() => {
            if (overlay) overlay.remove()
            dialog.remove()
        }, secondsUntilClose * 1000)
        dialog.addEventListener("mousemove", () => clearTimeout(timeoutId))
    }
}


function fontSize(adjustment){
    //adjust the font size for the post

    //const zoom = parseFloat(window.getComputedStyle(document.body).getPropertyValue('--font-zoom'))
    if(!adjustment){
        variables.fontZoom = 1
        //document.body.style.setProperty('--font-zoom', 1);
    }else{
        variables.fontZoom = Math.round((variables.fontZoom+adjustment)*10)/10
        //document.body.style.setProperty('--font-zoom', zoom + adjustment);
    }
    document.body.style.setProperty('--font-zoom', variables.fontZoom);
    localStorage.setItem(`book-settings`,JSON.stringify(variables))

}


function playAudio(td){
         let elem = td
         while(elem.className !== "audio-control"){
           elem=elem.parentElement
           //console.log(elem)
         } 
    //console.log("---->", elem.dataset.next)  
    audioDataUrl= elem.id + ".html"

      fetch(audioDataUrl)
        .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
        .then(html => {
        // The fetched content is the base64 string.
        // We need to create a data URL to play it.
        // This example assumes the audio is in WAV format. Adjust as needed.
        
        base64String=html.split("~~~~")[1]
        //console.log("base64String",base64String)
        const mimeType = 'audio/mpeg';
        const audioSrc = `data:${mimeType};base64,${base64String}`;
        

        // Create a new Audio object or element
//        const audio = new Audio(audioSrc);

        // To allow the user to see the controls, you can append an audio element to the DOM
         const audioEl = document.createElement('audio');
         audioEl.playbackRate = 2;
         audioEl.controls = true;
         audioEl.src = audioSrc;
         td.replaceChildren("");

        
        elem.replaceChildren(audioEl)
        audioEl.addEventListener('ended', ()=>{
          
          let audioTag = tag(elem.dataset.next)
          if(!audioTag){return}
          audioTag = audioTag.firstElementChild
          audioTag.scrollIntoView({ behavior: 'smooth' })
          if(audioTag.tagName.toLowerCase()==="audio"){
            audioTag.currentTime = 0;
            audioTag.play()
          }else{
            audioTag.click()
          }
        });
        // Play the audio automatically
        audioEl.play()
          .then(() => {
          //console.log('Audio is now playing.');
        })
          .catch(e => {
          console.log('Could not play audio. Check the console for an Autoplay Policy error.');
          console.error('Audio play error:', e);
        })
          .finally(() => {
          //playButton.disabled = false;
        });
      })
        .catch(error => {
        console.error(error)
        //handleError(error);
        //playButton.disabled = false;
      });      
    
    }


function makePrompt(evt,props){
  if(evt){
     console.log("event:", evt, props)
    let elem = evt.target
    const html=[]
    while(elem.tagName!=="H" + props.level){
      elem = elem.previousElementSibling
      if(elem.tagName==="DIV" && elem.className==="monaco"){
        continue
      }
      html.unshift(elem.outerHTML)
    }
    console.log("fount it:", elem.tagName) 
    console.log(html)
    const turndownService = new TurndownService();
    const prompt = ["I'm learning about javascript.  Please help me understand it by giving me three options: Walk me through the main points, Give me different examples covering the same content, or quizzing me on the main points.  Here's the text of the section:"]
    prompt.push(turndownService.turndown(html.join("")))

    prompt.push("Here's the table of content from the book so you can know what i've already learned and what else is coming up")
    prompt.push(tag("toc").innerText.split("\n\n\n").join("\n").split("\n\n").join("\n"))


    console.log()
    navigator.clipboard.writeText(prompt.join("\n\n"))
      .then(() => console.log("Copied!"))
      .catch(err => console.error("Failed:", err));
  }

}
