/*
 * Generated file — do not edit directly.
 * Source: webcomponents/src/components/a-quiz/
 * Rebuild: cd webcomponents && npm run build
 */
var T=n=>{throw TypeError(n)};var S=(n,s,c)=>s.has(n)||T("Cannot "+c);var g=(n,s,c)=>(S(n,s,"read from private field"),c?c.call(n):s.get(n)),q=(n,s,c)=>s.has(n)?T("Cannot add the same private member more than once"):s instanceof WeakSet?s.add(n):s.set(n,c),z=(n,s,c,x)=>(S(n,s,"write to private field"),x?x.call(n,c):s.set(n,c),c),m=(n,s,c)=>(S(n,s,"access private method"),c);(function(){"use strict";var b,y,f,l,C,w,L,v;const n=/^(\d+)\.\s+(.+)$/,s=/^(\*)?([A-Za-z])\)\s+(.+)$/;function c(u){const i=[];let e=null;for(const t of u.split(/\r?\n/)){const o=t.trim();if(!o)continue;const a=n.exec(o);if(a){e={prompt:a[2].trim(),choices:[]},i.push(e);continue}const d=s.exec(o);if(d){if(!e)throw new Error(`Choice "${o}" appeared before any question.`);e.choices.push({correct:!!d[1],key:d[2].toLowerCase(),text:d[3].trim()});continue}throw new Error(`Unrecognized quiz line: "${o}"`)}for(const[t,o]of i.entries()){if(o.choices.length===0)throw new Error(`Question ${t+1} has no choices.`);if(!o.choices.some(a=>a.correct))throw new Error(`Question ${t+1} has no correct choice marked with *.`)}return i}function x(u){const i=u.slice();for(let e=i.length-1;e>0;e-=1){const t=Math.floor(Math.random()*(e+1)),o=i[e];i[e]=i[t],i[t]=o}return i}const k="a-quiz-host-styles",H=`
a-quiz > script[type="text/plain"],
a-quiz > script[type="text/quiz"] {
  display: none;
}
`,M=`
:host {
  display: block;
  font: 1rem/1.5 system-ui, sans-serif;
  color: #1a1a1a;
}

.quiz {
  display: grid;
  gap: 1.25rem;
}

.question {
  display: grid;
  gap: 0.5rem;
}

.prompt {
  margin: 0;
  font-weight: 600;
}

.choices {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.choice {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: start;
}

.choice input {
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

button {
  font: inherit;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border: 1px solid #888;
  border-radius: 4px;
  background: #f5f5f5;
}

button:hover {
  background: #ebebeb;
}

.result {
  margin: 0;
  font-weight: 600;
}

.question.is-correct {
  outline: 2px solid #2e7d32;
  outline-offset: 4px;
  border-radius: 4px;
  padding: 0.5rem;
}

.question.is-incorrect {
  outline: 2px solid #c62828;
  outline-offset: 4px;
  border-radius: 4px;
  padding: 0.5rem;
}

.error {
  margin: 0;
  color: #c62828;
}
`;function I(){if(typeof document>"u"||document.getElementById(k))return;const u=document.createElement("style");u.id=k,u.textContent=H,document.head.appendChild(u)}function E(u){return u.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function Q(u){const i=u.querySelector('script[type="text/plain"], script[type="text/quiz"]');return(i==null?void 0:i.textContent)!=null?i.textContent:u.textContent??""}class R extends HTMLElement{constructor(){super(...arguments);q(this,l);q(this,b,"");q(this,y,!1);q(this,f,[])}static get observedAttributes(){return["randomize"]}get randomize(){return this.hasAttribute("randomize")}set randomize(e){e?this.setAttribute("randomize",""):this.removeAttribute("randomize")}connectedCallback(){g(this,y)||(z(this,y,!0),I(),z(this,b,Q(this)),this.replaceChildren(),m(this,l,C).call(this),m(this,l,w).call(this))}attributeChangedCallback(e){!g(this,y)||e!=="randomize"||m(this,l,w).call(this)}}b=new WeakMap,y=new WeakMap,f=new WeakMap,l=new WeakSet,C=function(){if(this.shadowRoot)return this.shadowRoot;const e=this.attachShadow({mode:"open"}),t=document.createElement("style");return t.textContent=M,e.append(t),e},w=function(){var a,d;const e=m(this,l,C).call(this);(a=e.querySelector(".quiz"))==null||a.remove(),(d=e.querySelector(".error"))==null||d.remove();try{const r=c(g(this,b));z(this,f,this.randomize?x(r):r)}catch(r){const p=r instanceof Error?r.message:String(r),h=document.createElement("p");h.className="error",h.textContent=`a-quiz error: ${p}`,e.append(h);return}const t=document.createElement("div");t.className="quiz",t.innerHTML=g(this,f).map((r,p)=>m(this,l,L).call(this,r,p)).join("");const o=document.createElement("div");o.className="actions",o.innerHTML=`
      <button type="button" data-action="check">Check answers</button>
      <button type="button" data-action="reset">Reset</button>
      <p class="result" data-result hidden></p>
    `,t.append(o),o.addEventListener("click",r=>{const p=r.target;if(!(p instanceof HTMLElement))return;const h=p.getAttribute("data-action");h==="check"?m(this,l,v).call(this,t):h==="reset"&&m(this,l,w).call(this)}),e.append(t)},L=function(e,t){const o=t+1,a=`q${o}`,d=e.choices.map(r=>{const p=`${a}-${r.key}`;return`
          <li class="choice">
            <input type="radio" id="${p}" name="${a}" value="${E(r.key)}" />
            <label for="${p}"><strong>${E(r.key)})</strong> ${E(r.text)}</label>
          </li>
        `}).join("");return`
      <section class="question" data-question-index="${t}">
        <p class="prompt">${o}. ${E(e.prompt)}</p>
        <ul class="choices">${d}</ul>
      </section>
    `},v=function(e){let t=0;e.querySelectorAll(".question").forEach((d,r)=>{var A;const p=g(this,f)[r];if(!p)return;const h=d.querySelector('input[type="radio"]:checked'),_=(A=p.choices.find(N=>N.correct))==null?void 0:A.key,$=!!(h&&h.value===_);$&&(t+=1),d.classList.toggle("is-correct",$),d.classList.toggle("is-incorrect",!$)});const a=e.querySelector("[data-result]");a&&(a.hidden=!1,a.textContent=`Score: ${t} / ${g(this,f).length}`)},customElements.get("a-quiz")||customElements.define("a-quiz",R)})();
