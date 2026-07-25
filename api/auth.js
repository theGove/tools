/*
 * Generated file — do not edit directly.
 * Source: tools/modules-builder/src/modules/auth/
 * Rebuild: cd tools/modules-builder && npm run build -- auth
 */
(function(Y){"use strict";let y=Object.getPrototypeOf,O,M,f,S,ee={isConnected:1},ye=1e3,N,W={},ke=y(ee),te=y(y),P,ae=(e,t,r,a)=>(e??(a?setTimeout(r,a):queueMicrotask(r),new Set)).add(t),ne=(e,t,r)=>{let a=f;f=t;try{return e(r)}catch(i){return console.error(i),r}finally{f=a}},R=e=>e.filter(t=>{var r;return(r=t._dom)==null?void 0:r.isConnected}),re=e=>N=ae(N,e,()=>{for(let t of N)t._bindings=R(t._bindings),t._listeners=R(t._listeners);N=P},ye),q={get val(){var e;return(e=f==null?void 0:f._getters)==null||e.add(this),this.rawVal},get oldVal(){var e;return(e=f==null?void 0:f._getters)==null||e.add(this),this._oldVal},set val(e){var t;(t=f==null?void 0:f._setters)==null||t.add(this),e!==this.rawVal&&(this.rawVal=e,this._bindings.length+this._listeners.length?(M==null||M.add(this),O=ae(O,this,_e)):this._oldVal=e)}},se=e=>({__proto__:q,rawVal:e,_oldVal:e,_bindings:[],_listeners:[]}),z=(e,t)=>{let r={_getters:new Set,_setters:new Set},a={f:e},i=S;S=[];let c=ne(e,r,t);c=(c??document).nodeType?c:new Text(c);for(let d of r._getters)r._setters.has(d)||(re(d),d._bindings.push(a));for(let d of S)d._dom=c;return S=i,a._dom=c},K=(e,t=se(),r)=>{let a={_getters:new Set,_setters:new Set},i={f:e,s:t};i._dom=r??(S==null?void 0:S.push(i))??ee,t.val=ne(e,a,t.rawVal);for(let c of a._getters)a._setters.has(c)||(re(c),c._listeners.push(i));return t},oe=(e,...t)=>{for(let r of t.flat(1/0)){let a=y(r??0),i=a===q?z(()=>r.val):a===te?z(r):r;i!=P&&e.append(i)}return e},ie=(e,t,...r)=>{var A,V,L;let[{is:a,...i},...c]=y(r[0]??0)===ke?r:[{},...r],d=e?document.createElementNS(e,t,{is:a}):document.createElement(t,{is:a});for(let[b,w]of Object.entries(i)){let T=p=>p&&(Object.getOwnPropertyDescriptor(p,b)??T(y(p))),k=!e&&!a&&!t.includes("-")?W[V=t+","+b]??(W[V]=((A=T(y(d)))==null?void 0:A.set)??0):(L=T(y(d)))==null?void 0:L.set,E=b.startsWith("on"),_=E?(p,g)=>{let C=b.slice(2);d.removeEventListener(C,g),d.addEventListener(C,p)}:k?k.bind(d):d.setAttribute.bind(d,b),m=y(w??0);E||m===te&&(w=K(w),m=q),m===q?z(()=>(_(w.val,w._oldVal),d)):_(w)}return oe(d,c)},le=e=>({get:(t,r)=>ie.bind(P,e,r)}),de=(e,t)=>t?t!==e&&e.replaceWith(t):e.remove(),_e=()=>{let e=100,t=[...O].filter(a=>a.rawVal!==a._oldVal);do{M=new Set;for(let a of new Set(t.flatMap(i=>i._listeners=R(i._listeners))))K(a.f,a.s,a._dom),a._dom=P}while(--e&&(t=[...M]).length);let r=[...O].filter(a=>a.rawVal!==a._oldVal);O=P;for(let a of new Set(r.flatMap(i=>i._bindings=R(i._bindings))))de(a._dom,z(a.f,a._dom)),a._dom=P;for(let a of r)a._oldVal=a.rawVal};const u={tags:new Proxy(e=>new Proxy(ie,le(e)),le()),hydrate:(e,t)=>de(e,z(t,e)),add:oe,state:se,derive:K},{button:v,dd:U,div:l,dl:Se,dt:D,form:Q,h2:ce,input:H,label:B,p:x,pre:xe,span:j}=u.tags,ue="data-auth-mounted",he="data-auth-styles",Ae="http://localhost:2732",Te=`
@layer availabooks-auth {
  .auth {
    --auth-font: "Roboto", "Helvetica Neue", Arial, sans-serif;
    --auth-heading-font: "Taviraj", Georgia, serif;
    --auth-page-bg: var(--page-bg, #f8fafc);
    --auth-surface: var(--surface, #ffffff);
    --auth-surface-soft: var(--surface-soft, #f1f5f9);
    --auth-text: var(--text, #172033);
    --auth-muted: var(--text-muted, #64748b);
    --auth-heading: var(--heading, #0f172a);
    --auth-accent: var(--accent, #2563eb);
    --auth-accent-strong: var(--accent-strong, #1d4ed8);
    --auth-accent-soft: var(--accent-soft, #dbeafe);
    --auth-danger: var(--danger, #dc2626);
    --auth-border: var(--border, #dbe3ee);
    --auth-shadow-sm: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
    --auth-shadow-md: var(--shadow-md, 0 12px 30px rgba(15, 23, 42, 0.12));
    --auth-radius-sm: var(--radius-sm, 0.5rem);
    --auth-radius-md: var(--radius-md, 0.85rem);
    display: block;
    max-width: 26rem;
    margin: 1.5rem 0;
    font-family: var(--auth-font);
    font-size: 1rem;
    line-height: 1.55;
    color: var(--auth-text);
    -webkit-font-smoothing: antialiased;
  }

  .auth .panel {
    display: grid;
    gap: 1.15rem;
    padding: 1.35rem 1.4rem 1.25rem;
    border: 1px solid var(--auth-border);
    border-radius: var(--auth-radius-md);
    background: var(--auth-surface);
    box-shadow: var(--auth-shadow-md);
  }

  .auth .heading {
    margin: 0;
    font-family: var(--auth-heading-font);
    font-size: clamp(1.35rem, 3.5vw, 1.65rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: var(--auth-heading);
  }

  .auth .lead {
    margin: 0;
    color: var(--auth-muted);
    font-size: 0.95rem;
  }

  .auth .status {
    margin: 0;
    padding: 0.65rem 0.85rem;
    border-radius: var(--auth-radius-sm);
    background: var(--auth-surface-soft);
    border: 1px solid var(--auth-border);
    color: var(--auth-muted);
    font-size: 0.92rem;
  }

  .auth .status.is-error {
    color: var(--auth-danger);
    background: #fef2f2;
    border-color: #fecaca;
  }

  .auth .login,
  .auth .profile {
    display: grid;
    gap: 1rem;
  }

  .auth .login[hidden],
  .auth .profile[hidden],
  .auth .status[hidden],
  .auth .sign-in-form[hidden],
  .auth .sign-in-message[hidden],
  .auth .raw[hidden] {
    display: none !important;
  }

  .auth .login-header,
  .auth .profile-header {
    display: grid;
    gap: 0.35rem;
  }

  .auth .sign-in-form {
    display: grid;
    gap: 0.55rem;
  }

  .auth .field {
    display: grid;
    gap: 0.35rem;
  }

  .auth .sign-in-label {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--auth-muted);
  }

  .auth .sign-in-input {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    padding: 0.6rem 0.85rem;
    border: 1px solid var(--auth-border);
    border-radius: var(--auth-radius-sm);
    background: var(--auth-surface);
    color: var(--auth-text);
    box-shadow: var(--auth-shadow-sm);
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .auth .sign-in-input:focus {
    border-color: var(--auth-accent);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.13);
  }

  .auth .sign-in-hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--auth-muted);
  }

  .auth .sign-in-message {
    margin: 0;
    font-size: 0.92rem;
    color: var(--auth-muted);
  }

  .auth .sign-in-message.is-error {
    color: var(--auth-danger);
  }

  .auth .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
  }

  .auth .actions-stack {
    display: grid;
    gap: 0.55rem;
    margin-top: 0.25rem;
  }

  .auth button {
    font: inherit;
    cursor: pointer;
  }

  .auth .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 1rem;
    border-radius: var(--auth-radius-sm);
    border: 1px solid transparent;
    font-weight: 600;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease,
      transform 0.18s ease, box-shadow 0.18s ease;
  }

  .auth .btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .auth .btn-primary {
    background: var(--auth-accent);
    color: #fff;
    box-shadow: var(--auth-shadow-sm);
  }

  .auth .btn-primary:hover:not(:disabled) {
    background: var(--auth-accent-strong);
  }

  .auth .btn-secondary {
    background: var(--auth-surface);
    color: var(--auth-accent);
    border-color: var(--auth-border);
    box-shadow: var(--auth-shadow-sm);
  }

  .auth .btn-secondary:hover:not(:disabled) {
    background: var(--auth-accent-soft);
    border-color: #bfdbfe;
    color: var(--auth-accent-strong);
  }

  .auth .btn-ghost {
    background: transparent;
    color: var(--auth-accent);
    border: 0;
    padding: 0.35rem 0;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .auth .btn-ghost:hover:not(:disabled) {
    color: var(--auth-accent-strong);
    transform: none;
  }

  .auth button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  .auth .profile-identity {
    display: flex;
    align-items: center;
    gap: 0.95rem;
  }

  .auth .avatar {
    display: grid;
    place-items: center;
    width: 3.5rem;
    height: 3.5rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--auth-accent-soft);
    color: var(--auth-accent-strong);
    font-family: var(--auth-heading-font);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .auth .profile-name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--auth-heading);
  }

  .auth .profile-email {
    margin: 0.2rem 0 0;
    color: var(--auth-muted);
    word-break: break-word;
  }

  .auth .details {
    margin: 0;
    display: grid;
    gap: 0;
  }

  .auth .details > div {
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--auth-border);
  }

  .auth .details > div:first-child {
    padding-top: 0;
  }

  .auth .details > div:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .auth .details dt {
    margin: 0;
    color: var(--auth-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .auth .details dd {
    margin: 0;
    word-break: break-word;
  }

  .auth .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .auth .chip {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: var(--auth-accent-soft);
    color: var(--auth-accent-strong);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .auth .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding-top: 0.35rem;
    border-top: 1px solid var(--auth-border);
  }

  .auth .tools .btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .auth .raw {
    margin: 0;
    padding: 0.75rem 0.85rem;
    overflow: auto;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: var(--auth-radius-md);
    background: #0f172a;
    color: #dbeafe;
    box-shadow: var(--auth-shadow-sm);
    font: 0.82rem/1.4 "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
      monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
`;function Ee(){if(typeof document>"u"||document.head.querySelector(`style[${he}]`))return;const e=document.createElement("style");e.setAttribute(he,""),e.textContent=Te,document.head.append(e)}function Ce(e,t){for(const r of t){const a=e.getAttribute(r);if(a!=null&&a.trim()!=="")return a.trim()}return null}function Pe(e){return{origin:(Ce(e,["data-origin","origin"])??Ae).replace(/\/$/,"")}}function J(e,t){return e?new URL(t,`${e}/`).toString():t}async function F(e,t,r){const a=await fetch(J(e,t),{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),i=await a.json().catch(()=>({}));return{response:a,payload:i}}function Ve(){const e=document.createElement("div");return e.className="auth",e.setAttribute(ue,""),e}function X(e){const t=[e.firstName,e.lastName].filter(Boolean);return t.length>0?t.join(" "):e.email||e.id}function Oe(e){var t;return(t=e.roles)!=null&&t.length?e.roles:e.role?[e.role]:[]}function Me(e){const t=u.state("loading"),r=u.state("Checking…"),a=u.state(null),i=u.state(null),c=u.state("password"),d=u.state("credentials"),A=u.state(null),V=u.state(!1),L=u.state("Enter the 6-digit code we sent to your email."),b=u.state(!1),w=u.state(!1),T=u.state(!1),k=u.state(""),E=u.state(""),_=u.state("");let m={mode:"magic",email:"",pendingAuthenticationToken:null};const p=()=>{A.val=null,V.val=!1},g=(n,s=!1)=>{A.val=n,V.val=s},C=()=>{d.val="credentials",_.val="",p()},fe=n=>{d.val="code",_.val="",L.val=n.mode==="email_verification"?`Enter the verification code we sent to ${n.email}.`:`Enter the 6-digit code we sent to ${n.email}.`},$=(n,s)=>{t.val=n.kind,n.kind==="loading"?(r.val="Checking…",a.val=null):n.kind==="signed-out"?(r.val="Signed out",a.val=null,C()):n.kind==="signed-in"?(r.val=`Signed in as ${X(n.user)}`,a.val=n.user,p()):(r.val=n.message,a.val=null,C()),i.val=s===void 0?null:JSON.stringify(s,null,2)},G=async()=>{$({kind:"loading"});const n=J(e,"/api/auth/me");try{const s=await fetch(n,{credentials:"include"}),o=await s.json().catch(()=>null);if(!s.ok){$({kind:"error",message:`auth/me failed: HTTP ${s.status}`},o);return}const h=o==null?void 0:o.user;if(!h){$({kind:"signed-out"},o);return}$({kind:"signed-in",user:h},o)}catch(s){const o=s instanceof Error?s.message:String(s);$({kind:"error",message:`Could not reach Pro auth (${o}). Is the Pro server running at this origin? Books must be on *.availabooks.com (or localhost) so the session cookie is sent.`})}},ze=async()=>{const n=J(e,"/api/auth/protected");try{const s=await fetch(n,{credentials:"include"}),o=await s.json().catch(()=>null);i.val=JSON.stringify({status:s.status,body:o},null,2),s.ok||(t.val="error",r.val=`Protected route: HTTP ${s.status}`)}catch(s){const o=s instanceof Error?s.message:String(s);i.val=o,t.val="error",r.val="Protected route request failed"}},pe=async(n,s,o,h)=>{if(s.status==="email_verification_required"){m={mode:"email_verification",email:String(s.email||o),pendingAuthenticationToken:typeof s.pendingAuthenticationToken=="string"?s.pendingAuthenticationToken:null},fe(m),g("Check your email for a verification code.");return}if(!n.ok||s.status!=="authenticated"){g(String(s.message||s.error||h),!0);return}p(),E.val="",await G()},ve=async(n,s)=>{n.preventDefault();const o=k.val.trim(),h=E.val;if(!o){g("Enter your email address.",!0);return}if(!h){g("Enter your password.",!0);return}p(),b.val=!0;try{const{response:I,payload:Z}=await F(e,s,{email:o,password:h});await pe(I,Z,o,s==="/api/auth/password/sign-up"?"Could not create account.":"Invalid email or password.")}catch(I){const Z=I instanceof Error?I.message:String(I);g(`Could not sign in (${Z}).`,!0)}finally{b.val=!1}},je=async n=>{n.preventDefault();const s=k.val.trim();if(!s){g("Enter your email address.",!0);return}p(),w.val=!0;try{const{response:o,payload:h}=await F(e,"/api/auth/magic/send",{email:s});if(!o.ok||h.status!=="sent"){g(String(h.message||h.error||"Could not send code."),!0);return}m={mode:"magic",email:s,pendingAuthenticationToken:null},g("Code sent. Check your inbox."),fe(m)}catch(o){const h=o instanceof Error?o.message:String(o);g(`Could not send code (${h}).`,!0)}finally{w.val=!1}},Le=async n=>{n.preventDefault();const s=_.val.trim();if(!s){g("Enter the verification code.",!0);return}p(),T.val=!0;try{const{response:o,payload:h}=m.mode==="email_verification"?await F(e,"/api/auth/email-verification/verify",{code:s,pendingAuthenticationToken:m.pendingAuthenticationToken||""}):await F(e,"/api/auth/magic/verify",{email:m.email,code:s});await pe(o,h,m.email,"Invalid or expired code.")}catch(o){const h=o instanceof Error?o.message:String(o);g(`Could not verify code (${h}).`,!0)}finally{T.val=!1}},$e=()=>{m={mode:"magic",email:"",pendingAuthenticationToken:null},C()},be=n=>{c.val=n,C()},we=e||"(same origin)",Ie=async()=>{try{await fetch(J(e,"/api/auth/logout"),{method:"POST",credentials:"include",headers:{Accept:"application/json"}})}catch{}await G()},Ne=()=>c.val==="magic"?"Enter your email and we will send a one-time code.":"Sign in with your email and password, or create an account.";return G(),l({class:"panel"},x({class:()=>t.val==="error"?"status is-error":"status",hidden:()=>t.val==="signed-in"||t.val==="signed-out"},r),l({class:"profile",hidden:()=>t.val!=="signed-in"||a.val==null},l({class:"profile-header"},ce({class:"heading"},"Profile"),x({class:"lead"},"You are signed in to Pro.")),l({class:"profile-identity"},l({class:"avatar","aria-hidden":"true"},()=>(a.val?X(a.val):"?").slice(0,1).toUpperCase()),l(x({class:"profile-name"},()=>a.val?X(a.val):""),x({class:"profile-email"},()=>{var n;return((n=a.val)==null?void 0:n.email)||""}))),Se({class:"details"},l(D("User ID"),U(()=>{var n;return((n=a.val)==null?void 0:n.id)||"—"})),l(D("Organization"),U(()=>{var n;return((n=a.val)==null?void 0:n.organizationId)||"—"})),l(D("Role"),U(()=>{const n=a.val;if(!n)return"—";const s=Oe(n);return s.length?j({class:"chip-row"},...s.map(o=>j({class:"chip"},o))):"—"})),l(D("Permissions"),U(()=>{var s;const n=((s=a.val)==null?void 0:s.permissions)??[];return n.length?j({class:"chip-row"},...n.map(o=>j({class:"chip"},o))):"—"}))),l({class:"actions"},v({type:"button",class:"btn btn-secondary",onclick:()=>void Ie()},"Sign out"))),l({class:"login",hidden:()=>t.val==="signed-in"||t.val==="loading"},l({class:"login-header"},ce({class:"heading"},"Sign in"),x({class:"lead"},Ne)),Q({class:"sign-in-form",hidden:()=>d.val!=="credentials"||c.val!=="password",onsubmit:n=>void ve(n,"/api/auth/password/sign-in")},l({class:"field"},B({class:"sign-in-label",for:"auth-email"},"Email"),H({id:"auth-email",class:"sign-in-input",type:"email",name:"email",autocomplete:"email",required:!0,placeholder:"you@example.com",value:k,oninput:n=>{k.val=n.target.value}})),l({class:"field"},B({class:"sign-in-label",for:"auth-password"},"Password"),H({id:"auth-password",class:"sign-in-input",type:"password",name:"password",autocomplete:"current-password",required:!0,placeholder:"••••••••",value:E,oninput:n=>{E.val=n.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>b.val},"Sign in"),v({type:"button",class:"btn btn-secondary",disabled:()=>b.val,onclick:n=>void ve(n,"/api/auth/password/sign-up")},"Create account"),v({type:"button",class:"btn btn-ghost",onclick:()=>be("magic")},"Use a one-time code instead"))),Q({class:"sign-in-form",hidden:()=>d.val!=="credentials"||c.val!=="magic",onsubmit:je},l({class:"field"},B({class:"sign-in-label",for:"auth-magic-email"},"Email"),H({id:"auth-magic-email",class:"sign-in-input",type:"email",name:"email",autocomplete:"email",required:!0,placeholder:"you@example.com",value:k,oninput:n=>{k.val=n.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>w.val},"Send code"),v({type:"button",class:"btn btn-ghost",onclick:()=>be("password")},"Use password instead"))),Q({class:"sign-in-form",hidden:()=>d.val!=="code",onsubmit:Le},x({class:"sign-in-hint"},L),l({class:"field"},B({class:"sign-in-label",for:"auth-code"},"Verification code"),H({id:"auth-code",class:"sign-in-input",type:"text",name:"code",inputmode:"numeric",autocomplete:"one-time-code",pattern:"[0-9]{6}",maxlength:"6",required:!0,placeholder:"123456",value:_,oninput:n=>{_.val=n.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>T.val},"Verify and sign in"),v({type:"button",class:"btn btn-ghost",onclick:$e},"Back"))),x({class:()=>V.val?"sign-in-message is-error":"sign-in-message",hidden:()=>A.val==null},()=>A.val??"")),l({class:"tools"},v({type:"button",class:"btn btn-secondary",onclick:()=>void G()},"Refresh"),v({type:"button",class:"btn btn-secondary",onclick:()=>void ze()},"Test protected"),j({class:"sign-in-hint",style:"margin-left:auto;font-size:0.78rem",title:we},()=>`Origin: ${we}`)),xe({class:"raw",hidden:()=>i.val==null},()=>i.val??""))}function me(e){if(!(e instanceof HTMLElement)||e.getAttribute(ue)!=null)return null;Ee();const t=Pe(e),r=Ve();return t.origin&&r.setAttribute("data-origin",t.origin),e.replaceWith(r),u.add(r,Me(t.origin)),r}function ge(e){const t=e||document;if(!t||!("querySelectorAll"in t))return[];const r=t.querySelectorAll("pre.auth"),a=[];for(const i of r){if(!(i instanceof HTMLElement))continue;const c=me(i);c&&a.push(c)}return a}typeof document<"u"&&ge(),Y.mountAuth=me,Y.scanAndMountAuths=ge,Object.defineProperty(Y,Symbol.toStringTag,{value:"Module"})})(this.auth=this.auth||{});
