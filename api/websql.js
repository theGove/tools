// reads the websql code from websql.org.
function loadCodeFromBlogger(url, label){
  //The url and label is used to generate the blog feed url
  const script = document.createElement('script');
  script.src = `${url}/feeds/posts/default/-/${label}?alt=json-in-script&max-results=1&&callback=loadCode`;
  document.head.appendChild(script);
}

function loadCode(json) {
  const scriptElement = document.createElement(`script`);
  scriptElement.textContent = json.feed.entry[0].content.$t;
  document.head.appendChild(scriptElement);
}







function init() {
  loadCodeFromBlogger("https://pglite.blogspot.com", "app");
}

init()                                             