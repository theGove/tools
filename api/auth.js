/*
 * Generated file — do not edit directly.
 * Source: tools/modules-builder/src/modules/auth/
 * Rebuild: cd tools/modules-builder && npm run build -- auth
 */
(function(W){"use strict";let y=Object.getPrototypeOf,O,M,f,_,ne={isConnected:1},xe=1e3,q,K={},Ae=y(ne),re=y(y),P,se=(e,t,n,a)=>(e??(a?setTimeout(n,a):queueMicrotask(n),new Set)).add(t),oe=(e,t,n)=>{let a=f;f=t;try{return e(n)}catch(i){return console.error(i),n}finally{f=a}},N=e=>e.filter(t=>{var n;return(n=t._dom)==null?void 0:n.isConnected}),ie=e=>q=se(q,e,()=>{for(let t of q)t._bindings=N(t._bindings),t._listeners=N(t._listeners);q=P},xe),R={get val(){var e;return(e=f==null?void 0:f._getters)==null||e.add(this),this.rawVal},get oldVal(){var e;return(e=f==null?void 0:f._getters)==null||e.add(this),this._oldVal},set val(e){var t;(t=f==null?void 0:f._setters)==null||t.add(this),e!==this.rawVal&&(this.rawVal=e,this._bindings.length+this._listeners.length?(M==null||M.add(this),O=se(O,this,Te)):this._oldVal=e)}},le=e=>({__proto__:R,rawVal:e,_oldVal:e,_bindings:[],_listeners:[]}),z=(e,t)=>{let n={_getters:new Set,_setters:new Set},a={f:e},i=_;_=[];let c=oe(e,n,t);c=(c??document).nodeType?c:new Text(c);for(let d of n._getters)n._setters.has(d)||(ie(d),d._bindings.push(a));for(let d of _)d._dom=c;return _=i,a._dom=c},Q=(e,t=le(),n)=>{let a={_getters:new Set,_setters:new Set},i={f:e,s:t};i._dom=n??(_==null?void 0:_.push(i))??ne,t.val=oe(e,a,t.rawVal);for(let c of a._getters)a._setters.has(c)||(ie(c),c._listeners.push(i));return t},de=(e,...t)=>{for(let n of t.flat(1/0)){let a=y(n??0),i=a===R?z(()=>n.val):a===re?z(n):n;i!=P&&e.append(i)}return e},ce=(e,t,...n)=>{var A,V,$;let[{is:a,...i},...c]=y(n[0]??0)===Ae?n:[{},...n],d=e?document.createElementNS(e,t,{is:a}):document.createElement(t,{is:a});for(let[b,w]of Object.entries(i)){let T=p=>p&&(Object.getOwnPropertyDescriptor(p,b)??T(y(p))),k=!e&&!a&&!t.includes("-")?K[V=t+","+b]??(K[V]=((A=T(y(d)))==null?void 0:A.set)??0):($=T(y(d)))==null?void 0:$.set,E=b.startsWith("on"),S=E?(p,g)=>{let C=b.slice(2);d.removeEventListener(C,g),d.addEventListener(C,p)}:k?k.bind(d):d.setAttribute.bind(d,b),m=y(w??0);E||m===re&&(w=Q(w),m=R),m===R?z(()=>(S(w.val,w._oldVal),d)):S(w)}return de(d,c)},ue=e=>({get:(t,n)=>ce.bind(P,e,n)}),he=(e,t)=>t?t!==e&&e.replaceWith(t):e.remove(),Te=()=>{let e=100,t=[...O].filter(a=>a.rawVal!==a._oldVal);do{M=new Set;for(let a of new Set(t.flatMap(i=>i._listeners=N(i._listeners))))Q(a.f,a.s,a._dom),a._dom=P}while(--e&&(t=[...M]).length);let n=[...O].filter(a=>a.rawVal!==a._oldVal);O=P;for(let a of new Set(n.flatMap(i=>i._bindings=N(i._bindings))))he(a._dom,z(a.f,a._dom)),a._dom=P;for(let a of n)a._oldVal=a.rawVal};const u={tags:new Proxy(e=>new Proxy(ce,ue(e)),ue()),hydrate:(e,t)=>he(e,z(t,e)),add:de,state:le,derive:Q},{button:v,dd:H,div:l,dl:Ee,dt:U,form:X,h2:me,input:D,label:B,p:x,pre:Ce,span:I}=u.tags,ge="data-auth-mounted",fe="data-auth-styles",Pe="http://localhost:2732",Ve=`
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
`;function Oe(){if(typeof document>"u"||document.head.querySelector(`style[${fe}]`))return;const e=document.createElement("style");e.setAttribute(fe,""),e.textContent=Ve,document.head.append(e)}function Me(e,t){for(const n of t){const a=e.getAttribute(n);if(a!=null&&a.trim()!=="")return a.trim()}return null}function ze(e){return{origin:(Me(e,["data-origin","origin"])??Pe).replace(/\/$/,"")}}function F(e,t){return e?new URL(t,`${e}/`).toString():t}function pe(e){return`availabooks.wos-session:${e||"same-origin"}`}function Ie(e){try{return localStorage.getItem(pe(e))}catch{return null}}function Z(e,t){try{const n=pe(e);if(!t){localStorage.removeItem(n);return}localStorage.setItem(n,t)}catch{}}function ee(e,t){if(!t||typeof t!="object")return;const n=t.session;typeof n=="string"&&n.trim()&&Z(e,n.trim())}function J(e,t){const n=new Headers(t),a=Ie(e);return a&&n.set("Authorization",`Bearer ${a}`),n}async function G(e,t,n){const a=await fetch(F(e,t),{method:"POST",credentials:"include",headers:J(e,{"Content-Type":"application/json"}),body:JSON.stringify(n)}),i=await a.json().catch(()=>({}));return ee(e,i),{response:a,payload:i}}function $e(){const e=document.createElement("div");return e.className="auth",e.setAttribute(ge,""),e}function te(e){const t=[e.firstName,e.lastName].filter(Boolean);return t.length>0?t.join(" "):e.email||e.id}function je(e){var t;return(t=e.roles)!=null&&t.length?e.roles:e.role?[e.role]:[]}function Le(e){const t=u.state("loading"),n=u.state("Checking…"),a=u.state(null),i=u.state(null),c=u.state("password"),d=u.state("credentials"),A=u.state(null),V=u.state(!1),$=u.state("Enter the 6-digit code we sent to your email."),b=u.state(!1),w=u.state(!1),T=u.state(!1),k=u.state(""),E=u.state(""),S=u.state("");let m={mode:"magic",email:"",pendingAuthenticationToken:null};const p=()=>{A.val=null,V.val=!1},g=(r,s=!1)=>{A.val=r,V.val=s},C=()=>{d.val="credentials",S.val="",p()},we=r=>{d.val="code",S.val="",$.val=r.mode==="email_verification"?`Enter the verification code we sent to ${r.email}.`:`Enter the 6-digit code we sent to ${r.email}.`},j=(r,s)=>{t.val=r.kind,r.kind==="loading"?(n.val="Checking…",a.val=null):r.kind==="signed-out"?(n.val="Signed out",a.val=null,C()):r.kind==="signed-in"?(n.val=`Signed in as ${te(r.user)}`,a.val=r.user,p()):(n.val=r.message,a.val=null,C()),i.val=s===void 0?null:JSON.stringify(s,null,2)},Y=async()=>{j({kind:"loading"});const r=F(e,"/api/auth/me");try{const s=await fetch(r,{credentials:"include",headers:J(e)}),o=await s.json().catch(()=>null);if(!s.ok){j({kind:"error",message:`auth/me failed: HTTP ${s.status}`},o);return}const h=o==null?void 0:o.user;if(!h){Z(e,null),j({kind:"signed-out"},o);return}ee(e,o),j({kind:"signed-in",user:h},o)}catch(s){const o=s instanceof Error?s.message:String(s);j({kind:"error",message:`Could not reach Pro auth (${o}). Is the Pro server running at this origin? Cross-origin cookies require the book and Pro to share a site, or view this chapter on Pro.`})}},qe=async()=>{const r=F(e,"/api/auth/protected");try{const s=await fetch(r,{credentials:"include",headers:J(e)}),o=await s.json().catch(()=>null);i.val=JSON.stringify({status:s.status,body:o},null,2),s.ok||(t.val="error",n.val=`Protected route: HTTP ${s.status}`)}catch(s){const o=s instanceof Error?s.message:String(s);i.val=o,t.val="error",n.val="Protected route request failed"}},ye=async(r,s,o,h)=>{if(s.status==="email_verification_required"){m={mode:"email_verification",email:String(s.email||o),pendingAuthenticationToken:typeof s.pendingAuthenticationToken=="string"?s.pendingAuthenticationToken:null},we(m),g("Check your email for a verification code.");return}if(!r.ok||s.status!=="authenticated"){g(String(s.message||s.error||h),!0);return}p(),E.val="",ee(e,s),await Y()},ke=async(r,s)=>{r.preventDefault();const o=k.val.trim(),h=E.val;if(!o){g("Enter your email address.",!0);return}if(!h){g("Enter your password.",!0);return}p(),b.val=!0;try{const{response:L,payload:ae}=await G(e,s,{email:o,password:h});await ye(L,ae,o,s==="/api/auth/password/sign-up"?"Could not create account.":"Invalid email or password.")}catch(L){const ae=L instanceof Error?L.message:String(L);g(`Could not sign in (${ae}).`,!0)}finally{b.val=!1}},Ne=async r=>{r.preventDefault();const s=k.val.trim();if(!s){g("Enter your email address.",!0);return}p(),w.val=!0;try{const{response:o,payload:h}=await G(e,"/api/auth/magic/send",{email:s});if(!o.ok||h.status!=="sent"){g(String(h.message||h.error||"Could not send code."),!0);return}m={mode:"magic",email:s,pendingAuthenticationToken:null},g("Code sent. Check your inbox."),we(m)}catch(o){const h=o instanceof Error?o.message:String(o);g(`Could not send code (${h}).`,!0)}finally{w.val=!1}},Re=async r=>{r.preventDefault();const s=S.val.trim();if(!s){g("Enter the verification code.",!0);return}p(),T.val=!0;try{const{response:o,payload:h}=m.mode==="email_verification"?await G(e,"/api/auth/email-verification/verify",{code:s,pendingAuthenticationToken:m.pendingAuthenticationToken||""}):await G(e,"/api/auth/magic/verify",{email:m.email,code:s});await ye(o,h,m.email,"Invalid or expired code.")}catch(o){const h=o instanceof Error?o.message:String(o);g(`Could not verify code (${h}).`,!0)}finally{T.val=!1}},He=()=>{m={mode:"magic",email:"",pendingAuthenticationToken:null},C()},Se=r=>{c.val=r,C()},_e=e||"(same origin)",Ue=async()=>{try{await fetch(F(e,"/api/auth/logout"),{method:"POST",credentials:"include",headers:J(e,{Accept:"application/json"})})}catch{}Z(e,null),await Y()},De=()=>c.val==="magic"?"Enter your email and we will send a one-time code.":"Sign in with your email and password, or create an account.";return Y(),l({class:"panel"},x({class:()=>t.val==="error"?"status is-error":"status",hidden:()=>t.val==="signed-in"||t.val==="signed-out"},n),l({class:"profile",hidden:()=>t.val!=="signed-in"||a.val==null},l({class:"profile-header"},me({class:"heading"},"Profile"),x({class:"lead"},"You are signed in to Pro.")),l({class:"profile-identity"},l({class:"avatar","aria-hidden":"true"},()=>(a.val?te(a.val):"?").slice(0,1).toUpperCase()),l(x({class:"profile-name"},()=>a.val?te(a.val):""),x({class:"profile-email"},()=>{var r;return((r=a.val)==null?void 0:r.email)||""}))),Ee({class:"details"},l(U("User ID"),H(()=>{var r;return((r=a.val)==null?void 0:r.id)||"—"})),l(U("Organization"),H(()=>{var r;return((r=a.val)==null?void 0:r.organizationId)||"—"})),l(U("Role"),H(()=>{const r=a.val;if(!r)return"—";const s=je(r);return s.length?I({class:"chip-row"},...s.map(o=>I({class:"chip"},o))):"—"})),l(U("Permissions"),H(()=>{var s;const r=((s=a.val)==null?void 0:s.permissions)??[];return r.length?I({class:"chip-row"},...r.map(o=>I({class:"chip"},o))):"—"}))),l({class:"actions"},v({type:"button",class:"btn btn-secondary",onclick:()=>void Ue()},"Sign out"))),l({class:"login",hidden:()=>t.val==="signed-in"||t.val==="loading"},l({class:"login-header"},me({class:"heading"},"Sign in"),x({class:"lead"},De)),X({class:"sign-in-form",hidden:()=>d.val!=="credentials"||c.val!=="password",onsubmit:r=>void ke(r,"/api/auth/password/sign-in")},l({class:"field"},B({class:"sign-in-label",for:"auth-email"},"Email"),D({id:"auth-email",class:"sign-in-input",type:"email",name:"email",autocomplete:"email",required:!0,placeholder:"you@example.com",value:k,oninput:r=>{k.val=r.target.value}})),l({class:"field"},B({class:"sign-in-label",for:"auth-password"},"Password"),D({id:"auth-password",class:"sign-in-input",type:"password",name:"password",autocomplete:"current-password",required:!0,placeholder:"••••••••",value:E,oninput:r=>{E.val=r.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>b.val},"Sign in"),v({type:"button",class:"btn btn-secondary",disabled:()=>b.val,onclick:r=>void ke(r,"/api/auth/password/sign-up")},"Create account"),v({type:"button",class:"btn btn-ghost",onclick:()=>Se("magic")},"Use a one-time code instead"))),X({class:"sign-in-form",hidden:()=>d.val!=="credentials"||c.val!=="magic",onsubmit:Ne},l({class:"field"},B({class:"sign-in-label",for:"auth-magic-email"},"Email"),D({id:"auth-magic-email",class:"sign-in-input",type:"email",name:"email",autocomplete:"email",required:!0,placeholder:"you@example.com",value:k,oninput:r=>{k.val=r.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>w.val},"Send code"),v({type:"button",class:"btn btn-ghost",onclick:()=>Se("password")},"Use password instead"))),X({class:"sign-in-form",hidden:()=>d.val!=="code",onsubmit:Re},x({class:"sign-in-hint"},$),l({class:"field"},B({class:"sign-in-label",for:"auth-code"},"Verification code"),D({id:"auth-code",class:"sign-in-input",type:"text",name:"code",inputmode:"numeric",autocomplete:"one-time-code",pattern:"[0-9]{6}",maxlength:"6",required:!0,placeholder:"123456",value:S,oninput:r=>{S.val=r.target.value}})),l({class:"actions-stack"},v({type:"submit",class:"btn btn-primary",disabled:()=>T.val},"Verify and sign in"),v({type:"button",class:"btn btn-ghost",onclick:He},"Back"))),x({class:()=>V.val?"sign-in-message is-error":"sign-in-message",hidden:()=>A.val==null},()=>A.val??"")),l({class:"tools"},v({type:"button",class:"btn btn-secondary",onclick:()=>void Y()},"Refresh"),v({type:"button",class:"btn btn-secondary",onclick:()=>void qe()},"Test protected"),I({class:"sign-in-hint",style:"margin-left:auto;font-size:0.78rem",title:_e},()=>`Origin: ${_e}`)),Ce({class:"raw",hidden:()=>i.val==null},()=>i.val??""))}function ve(e){if(!(e instanceof HTMLElement)||e.getAttribute(ge)!=null)return null;Oe();const t=ze(e),n=$e();return t.origin&&n.setAttribute("data-origin",t.origin),e.replaceWith(n),u.add(n,Le(t.origin)),n}function be(e){const t=e||document;if(!t||!("querySelectorAll"in t))return[];const n=t.querySelectorAll("pre.auth"),a=[];for(const i of n){if(!(i instanceof HTMLElement))continue;const c=ve(i);c&&a.push(c)}return a}typeof document<"u"&&be(),W.mountAuth=ve,W.scanAndMountAuths=be,Object.defineProperty(W,Symbol.toStringTag,{value:"Module"})})(this.auth=this.auth||{});
