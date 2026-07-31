

function init2() {
  const {button, div, pre} = van.tags
  console.log("i'm initializing!")
  for(const el of document.querySelectorAll("div.assessment-sql")){
    data = JSON.parse(el.innerText)
    console.log("================================, data")

    el.replaceChildren(div(button({onclick: () => startAssessment(data.assessment)},"Begin Assessment")," ",data.name,))
    el.classList.remove("hidden")
  }
}

function startAssessment(assessment){
  console.log("assessment",)
  getAssessmentJson(assessment) 

}

function gotAssessment(x){
  console.log(x)
  const data = x.feed.entry[0].content.$t
  console.log("assessment", data)
}


  function getAssessmentJson(id){
		console.log(typeof location.hostname)
    console.log("=======> looks like production from server")
    const systemVersion=document.getElementById("cssScript").src.split("/")[7]
    loadCrossOrigin(`https://assessments.availabooks.com/feeds/posts/default/-/${id}?alt=json-in-script&max-results=1&callback=gotAssessment`);      

  }
    



init2()                                             