function runLocalCode(){
    console.log("running Local Code")
    //
    fetch(`${location.origin}/tools/api/css.css`).then(response => {
        return response.text(); 
        }).then(code => {
            //console.log("code", code)
          document.getElementById('dynamic-css').textContent=code
        })	    
    
}
runLocalCode()