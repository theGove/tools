/*
 * Generated file — do not edit directly.
 * Source: tools/modules-builder/src/modules/a-quiz/
 * Rebuild: cd tools/modules-builder && npm run build -- a-quiz
 */
(function(P){"use strict";let v=Object.getPrototypeOf,C,x,d,z,U={isConnected:1},le=1e3,M,R={},ce=v(U),H=v(v),A,K=(e,t,r,o)=>(e??(o?setTimeout(r,o):queueMicrotask(r),new Set)).add(t),G=(e,t,r)=>{let o=d;d=t;try{return e(r)}catch(n){return console.error(n),r}finally{d=o}},O=e=>e.filter(t=>{var r;return(r=t._dom)==null?void 0:r.isConnected}),F=e=>M=K(M,e,()=>{for(let t of M)t._bindings=O(t._bindings),t._listeners=O(t._listeners);M=A},le),V={get val(){var e;return(e=d==null?void 0:d._getters)==null||e.add(this),this.rawVal},get oldVal(){var e;return(e=d==null?void 0:d._getters)==null||e.add(this),this._oldVal},set val(e){var t;(t=d==null?void 0:d._setters)==null||t.add(this),e!==this.rawVal&&(this.rawVal=e,this._bindings.length+this._listeners.length?(x==null||x.add(this),C=K(C,this,ue)):this._oldVal=e)}},W=e=>({__proto__:V,rawVal:e,_oldVal:e,_bindings:[],_listeners:[]}),T=(e,t)=>{let r={_getters:new Set,_setters:new Set},o={f:e},n=z;z=[];let a=G(e,r,t);a=(a??document).nodeType?a:new Text(a);for(let s of r._getters)r._setters.has(s)||(F(s),s._bindings.push(o));for(let s of z)s._dom=a;return z=n,o._dom=a},L=(e,t=W(),r)=>{let o={_getters:new Set,_setters:new Set},n={f:e,s:t};n._dom=r??(z==null?void 0:z.push(n))??U,t.val=G(e,o,t.rawVal);for(let a of o._getters)o._setters.has(a)||(F(a),a._listeners.push(n));return t},B=(e,...t)=>{for(let r of t.flat(1/0)){let o=v(r??0),n=o===V?T(()=>r.val):o===H?T(r):r;n!=A&&e.append(n)}return e},D=(e,t,...r)=>{var p,l,f;let[{is:o,...n},...a]=v(r[0]??0)===ce?r:[{},...r],s=e?document.createElementNS(e,t,{is:o}):document.createElement(t,{is:o});for(let[m,g]of Object.entries(n)){let y=q=>q&&(Object.getOwnPropertyDescriptor(q,m)??y(v(q))),w=!e&&!o&&!t.includes("-")?R[l=t+","+m]??(R[l]=((p=y(v(s)))==null?void 0:p.set)??0):(f=y(v(s)))==null?void 0:f.set,b=m.startsWith("on"),_=b?(q,N)=>{let j=m.slice(2);s.removeEventListener(j,N),s.addEventListener(j,q)}:w?w.bind(s):s.setAttribute.bind(s,m),$=v(g??0);b||$===H&&(g=L(g),$=V),$===V?T(()=>(_(g.val,g._oldVal),s)):_(g)}return B(s,a)},Y=e=>({get:(t,r)=>D.bind(A,e,r)}),J=(e,t)=>t?t!==e&&e.replaceWith(t):e.remove(),ue=()=>{let e=100,t=[...C].filter(o=>o.rawVal!==o._oldVal);do{x=new Set;for(let o of new Set(t.flatMap(n=>n._listeners=O(n._listeners))))L(o.f,o.s,o._dom),o._dom=A}while(--e&&(t=[...x]).length);let r=[...C].filter(o=>o.rawVal!==o._oldVal);C=A;for(let o of new Set(r.flatMap(n=>n._bindings=O(n._bindings))))J(o._dom,T(o.f,o._dom)),o._dom=A;for(let o of r)o._oldVal=o.rawVal};const c={tags:new Proxy(e=>new Proxy(D,Y(e)),Y()),hydrate:(e,t)=>J(e,T(t,e)),add:B,state:W,derive:L},de=/^(\d+)\.\s+(.+)$/,fe=/^(\*)?([A-Za-z])\)\s+(.+)$/,me=/^>\s+(.+)$/;function he(e){const t=[];let r=null;for(const o of e.split(/\r?\n/)){const n=o.trim();if(!n)continue;const a=de.exec(n);if(a){r={prompt:a[2].trim(),choices:[]},t.push(r);continue}const s=fe.exec(n);if(s){if(!r)throw new Error(`Choice "${n}" appeared before any question.`);r.choices.push({correct:!!s[1],key:s[2].toLowerCase(),text:s[3].trim()});continue}const p=me.exec(n);if(p){if(!r)throw new Error(`Correct message "${n}" appeared before any question.`);if(r.choices.length===0)throw new Error(`Correct message for "${r.prompt}" appeared before any choices.`);const l=p[1].trim();r.correctMessage=r.correctMessage?`${r.correctMessage} ${l}`:l;continue}throw new Error(`Unrecognized quiz line: "${n}"`)}for(const[o,n]of t.entries()){if(n.choices.length===0)throw new Error(`Question ${o+1} has no choices.`);if(!n.choices.some(a=>a.correct))throw new Error(`Question ${o+1} has no correct choice marked with *.`)}return t}function pe(e){const t=e.slice();for(let r=t.length-1;r>0;r-=1){const o=Math.floor(Math.random()*(r+1)),n=t[r];t[r]=t[o],t[o]=n}return t}const{button:Q,div:E,input:ge,label:be,li:ve,p:S,section:ye,strong:we,ul:_e}=c.tags,Z="data-a-quiz-mounted",Se="http://localhost:2732",ke=`
:host {
  display: block;
  font: 1rem/1.5 system-ui, sans-serif;
  color: #1a1a1a;
}

.quiz {
  display: grid;
  gap: 1rem;
}

.quiz-panel {
  display: contents;
}

.progress {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
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

.choice.is-correct-choice label {
  color: #2e7d32;
  font-weight: 600;
}

.choice.is-wrong-choice label {
  color: #c62828;
}

.feedback {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.feedback[hidden] {
  display: none;
}

.feedback.is-correct {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.feedback.is-incorrect {
  background: #ffebee;
  border-color: #ef9a9a;
}

.feedback-status {
  margin: 0;
  font-weight: 600;
}

.correct-message {
  margin: 0;
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

button:hover:not(:disabled) {
  background: #ebebeb;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.result {
  margin: 0;
  font-weight: 600;
}

.submit-status {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #a5d6a7;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
}

.submit-status.is-error {
  border-color: #ef9a9a;
  background: #ffebee;
  color: #c62828;
}

.submit-status[hidden] {
  display: none;
}

button[data-action="submit"] {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
}

button[data-action="submit"]:hover:not(:disabled) {
  background: #333;
}

button[data-action="submit"]:disabled {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
  opacity: 0.7;
}

.error {
  margin: 0;
  color: #c62828;
}
`;function ze(e,t){for(const r of t){const o=e.getAttribute(r);if(o!=null&&o.trim()!=="")return o.trim()}return null}function qe(e){return(e.querySelector("code")||e).textContent??""}function Ae(e){return(ze(e,["data-origin","origin"])??Se).replace(/\/$/,"")}function Ee(e,t){return e?new URL(t,`${e}/`).toString():t}function X(e){return e.hasAttribute("randomize")||e.hasAttribute("data-randomize")}function $e(e,t){const r=document.createElement("div");return r.className="a-quiz",r.setAttribute(Z,""),X(e)&&r.setAttribute("data-randomize",e.getAttribute("data-randomize")??""),t&&r.setAttribute("data-origin",t),r}function ee(e){if(e.shadowRoot)return e.shadowRoot;const t=e.attachShadow({mode:"open"}),r=document.createElement("style");return r.textContent=ke,t.append(r),t}function te(e){var t;return(t=e.choices.find(r=>r.correct))==null?void 0:t.key}function Ce(e,t){const r=he(e);return t?pe(r):r}function xe(e,t,r){const o=c.state(null),n=c.state([]),a=c.state(0),s=c.state(0),p=c.state([]),l=c.state(!1),f=c.state(null),m=c.state(!1),g=c.state(!1),y=c.state(!1),w=c.state(!1),b=c.state(null),_=c.state(!1),$=()=>{try{n.val=Ce(e,t),o.val=null}catch(i){const u=i instanceof Error?i.message:String(i);o.val=u,n.val=[]}a.val=0,s.val=0,p.val=[],l.val=!1,f.val=null,m.val=!1,g.val=!1,y.val=!1,w.val=!1,b.val=null,_.val=!1},q=()=>{const i=n.val[a.val];if(!i||l.val||f.val==null)return;const u=te(i),k=!!(u&&f.val===u);k&&(s.val+=1),p.val=[...p.val,{index:a.val,prompt:i.prompt,selectedKey:f.val,correctKey:u,correct:k}],m.val=k,l.val=!0},N=()=>{if(l.val){if(a.val>=n.val.length-1){g.val=!0;return}a.val+=1,l.val=!1,f.val=null,m.val=!1}},j=async()=>{if(!(y.val||w.val)){w.val=!0,_.val=!1,b.val=null;try{const i=await fetch(Ee(r,"/api/submissions/submit"),{method:"POST",credentials:"include",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({type:"a-quiz",score:{correct:s.val,total:n.val.length},answers:p.val})}),u=await i.json().catch(()=>null);if(!i.ok){const k=u&&typeof u=="object"&&"error"in u?String(u.error):`HTTP ${i.status}`;_.val=!0,b.val=i.status===401?"Sign in to submit your quiz.":`Could not submit quiz (${k}).`;return}y.val=!0,_.val=!1,b.val="Your quiz has been submitted."}catch(i){const u=i instanceof Error?i.message:String(i);_.val=!0,b.val=`Could not reach Pro (${u}).`}finally{w.val=!1}}};$();const Me=(i,u,k)=>{const ne=u+1,ae=`q${ne}`,se=te(i),Ve=u>=k-1;return[S({class:"progress"},()=>`Question ${ne} of ${k}`),ye({class:"question"},S({class:"prompt"},i.prompt),_e({class:"choices"},...i.choices.map(h=>{const ie=`${ae}-${h.key}`;return ve({class:()=>{const I=["choice"];return l.val&&(h.key===se&&I.push("is-correct-choice"),h.key===f.val&&h.key!==se&&I.push("is-wrong-choice")),I.join(" ")}},ge({type:"radio",id:ie,name:ae,value:h.key,disabled:()=>l.val,onchange:()=>{l.val||(f.val=h.key)}}),be({for:ie},we(`${h.key})`),` ${h.text}`))})),E({class:()=>{const h=["feedback"];return l.val&&h.push(m.val?"is-correct":"is-incorrect"),h.join(" ")},hidden:()=>!l.val},S({class:"feedback-status"},()=>m.val?"Correct":"Incorrect"),i.correctMessage?S({class:"correct-message",hidden:()=>!l.val},i.correctMessage):null)),E({class:"actions"},Q({type:"button","data-action":"check",hidden:()=>l.val,disabled:()=>f.val==null,onclick:q},"Check answer"),Q({type:"button","data-action":"next",hidden:()=>!l.val,onclick:N},Ve?"See results":"Next question"))]},Oe=()=>[S({class:"result"},()=>`Score: ${s.val} / ${n.val.length}`),S({class:()=>_.val?"submit-status is-error":"submit-status",hidden:()=>b.val==null},()=>b.val??""),E({class:"actions"},Q({type:"button","data-action":"submit",disabled:()=>y.val||w.val,onclick:()=>void j()},()=>w.val?"Submitting…":y.val?"Submitted":"Submit quiz"),Q({type:"button","data-action":"reset",onclick:$},"Restart"))];return E({class:"quiz"},()=>{if(o.val)return S({class:"error"},`a-quiz error: ${o.val}`);if(g.val)return E({class:"quiz-panel"},...Oe());const i=n.val[a.val];return i?E({class:"quiz-panel"},...Me(i,a.val,n.val.length)):S({class:"error"},"a-quiz error: no questions found")})}function Te(e,t,r,o){var a,s;const n=ee(e);(a=n.querySelector(".quiz"))==null||a.remove(),(s=n.querySelector(".error"))==null||s.remove(),c.add(n,xe(t,r,o))}function re(e){if(!(e instanceof HTMLElement)||e.getAttribute(Z)!=null)return null;const t=qe(e),r=X(e),o=Ae(e),n=$e(e,o);return e.replaceWith(n),ee(n),Te(n,t,r,o),n}function oe(e){const t=e||document;if(!t||!("querySelectorAll"in t))return[];const r=t.querySelectorAll("pre.a-quiz"),o=[];for(const n of r){if(!(n instanceof HTMLElement))continue;const a=re(n);a&&o.push(a)}return o}typeof document<"u"&&oe(),P.mountAQuiz=re,P.scanAndMountAQuizzes=oe,Object.defineProperty(P,Symbol.toStringTag,{value:"Module"})})(this.a_quiz=this.a_quiz||{});
