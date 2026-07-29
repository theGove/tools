/*
 * Generated file — do not edit directly.
 * Source: tools/modules-builder/src/modules/auth/
 * Rebuild: cd tools/modules-builder && npm run build -- auth
 */
(function(z){"use strict";let h=Object.getPrototypeOf,v,b,c,f,$={isConnected:1},at=1e3,A,M={},rt=h($),I=h(h),m,H=(t,e,r,a)=>(t??(a?setTimeout(r,a):queueMicrotask(r),new Set)).add(e),q=(t,e,r)=>{let a=c;c=e;try{return t(r)}catch(s){return console.error(s),r}finally{c=a}},T=t=>t.filter(e=>{var r;return(r=e._dom)==null?void 0:r.isConnected}),D=t=>A=H(A,t,()=>{for(let e of A)e._bindings=T(e._bindings),e._listeners=T(e._listeners);A=m},at),P={get val(){var t;return(t=c==null?void 0:c._getters)==null||t.add(this),this.rawVal},get oldVal(){var t;return(t=c==null?void 0:c._getters)==null||t.add(this),this._oldVal},set val(t){var e;(e=c==null?void 0:c._setters)==null||e.add(this),t!==this.rawVal&&(this.rawVal=t,this._bindings.length+this._listeners.length?(b==null||b.add(this),v=H(v,this,nt)):this._oldVal=t)}},Y=t=>({__proto__:P,rawVal:t,_oldVal:t,_bindings:[],_listeners:[]}),w=(t,e)=>{let r={_getters:new Set,_setters:new Set},a={f:t},s=f;f=[];let i=q(t,r,e);i=(i??document).nodeType?i:new Text(i);for(let l of r._getters)r._setters.has(l)||(D(l),l._bindings.push(a));for(let l of f)l._dom=i;return f=s,a._dom=i},j=(t,e=Y(),r)=>{let a={_getters:new Set,_setters:new Set},s={f:t,s:e};s._dom=r??(f==null?void 0:f.push(s))??$,e.val=q(t,a,e.rawVal);for(let i of a._getters)a._setters.has(i)||(D(i),i._listeners.push(s));return e},F=(t,...e)=>{for(let r of e.flat(1/0)){let a=h(r??0),s=a===P?w(()=>r.val):a===I?w(r):r;s!=m&&t.append(s)}return t},G=(t,e,...r)=>{var C,k,L;let[{is:a,...s},...i]=h(r[0]??0)===rt?r:[{},...r],l=t?document.createElementNS(t,e,{is:a}):document.createElement(e,{is:a});for(let[g,n]of Object.entries(s)){let o=x=>x&&(Object.getOwnPropertyDescriptor(x,g)??o(h(x))),d=!t&&!a&&!e.includes("-")?M[k=e+","+g]??(M[k]=((C=o(h(l)))==null?void 0:C.set)??0):(L=o(h(l)))==null?void 0:L.set,S=g.startsWith("on"),tt=S?(x,pt)=>{let et=g.slice(2);l.removeEventListener(et,pt),l.addEventListener(et,x)}:d?d.bind(l):l.setAttribute.bind(l,g),U=h(n??0);S||U===I&&(n=j(n),U=P),U===P?w(()=>(tt(n.val,n._oldVal),l)):tt(n)}return F(l,i)},J=t=>({get:(e,r)=>G.bind(m,t,r)}),W=(t,e)=>e?e!==t&&t.replaceWith(e):t.remove(),nt=()=>{let t=100,e=[...v].filter(a=>a.rawVal!==a._oldVal);do{b=new Set;for(let a of new Set(e.flatMap(s=>s._listeners=T(s._listeners))))j(a.f,a.s,a._dom),a._dom=m}while(--t&&(e=[...b]).length);let r=[...v].filter(a=>a.rawVal!==a._oldVal);v=m;for(let a of new Set(r.flatMap(s=>s._bindings=T(s._bindings))))W(a._dom,w(a.f,a._dom)),a._dom=m;for(let a of r)a._oldVal=a.rawVal};const p={tags:new Proxy(t=>new Proxy(G,J(t)),J()),hydrate:(t,e)=>W(t,w(e,t)),add:F,state:Y,derive:j},{button:O,dd:E,div:u,dl:ot,dt:V,h2:B,p:y,pre:st,span:_}=p.tags,K="data-auth-mounted",Q="data-auth-styles",it="http://localhost:2732",lt=`
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
  .auth .raw[hidden] {
    display: none !important;
  }

  .auth .login-header,
  .auth .profile-header {
    display: grid;
    gap: 0.35rem;
  }

  .auth .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
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

  .auth .origin-hint {
    margin-left: auto;
    font-size: 0.78rem;
    color: var(--auth-muted);
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
`;function dt(){if(typeof document>"u"||document.head.querySelector(`style[${Q}]`))return;const t=document.createElement("style");t.setAttribute(Q,""),t.textContent=lt,document.head.append(t)}function ut(t,e){for(const r of e){const a=t.getAttribute(r);if(a!=null&&a.trim()!=="")return a.trim()}return null}function ct(t){return{origin:(ut(t,["data-origin","origin"])??it).replace(/\/$/,"")}}function N(t,e){return t?new URL(e,`${t}/`).toString():e}function ht(){const t=document.createElement("div");return t.className="auth",t.setAttribute(K,""),t}function R(t){const e=[t.firstName,t.lastName].filter(Boolean);return e.length>0?e.join(" "):t.email||t.id}function ft(t){var e;return(e=t.roles)!=null&&e.length?t.roles:t.role?[t.role]:[]}function gt(t){const e=new URL("/login",`${t||window.location.origin}/`);return e.searchParams.set("next",window.location.href),e.toString()}function mt(t){const e=p.state("loading"),r=p.state("Checking…"),a=p.state(null),s=p.state(null),i=(n,o)=>{e.val=n.kind,n.kind==="loading"?(r.val="Checking…",a.val=null):n.kind==="signed-out"?(r.val="Signed out",a.val=null):n.kind==="signed-in"?(r.val=`Signed in as ${R(n.user)}`,a.val=n.user):(r.val=n.message,a.val=null),s.val=o===void 0?null:JSON.stringify(o,null,2)},l=async()=>{i({kind:"loading"});const n=N(t,"/api/auth/me");try{const o=await fetch(n,{credentials:"include"}),d=await o.json().catch(()=>null);if(!o.ok){i({kind:"error",message:`auth/me failed: HTTP ${o.status}`},d);return}const S=d==null?void 0:d.user;if(!S){i({kind:"signed-out"},d);return}i({kind:"signed-in",user:S},d)}catch(o){const d=o instanceof Error?o.message:String(o);i({kind:"error",message:`Could not reach Pro auth (${d}). Is the Pro server running at this origin? Books must be on *.availabooks.com (or localhost) so the session cookie is sent.`})}},C=async()=>{const n=N(t,"/api/auth/protected");try{const o=await fetch(n,{credentials:"include"}),d=await o.json().catch(()=>null);s.val=JSON.stringify({status:o.status,body:d},null,2),o.ok||(e.val="error",r.val=`Protected route: HTTP ${o.status}`)}catch(o){const d=o instanceof Error?o.message:String(o);s.val=d,e.val="error",r.val="Protected route request failed"}},k=t||"(same origin)",L=()=>{window.location.assign(gt(t))},g=async()=>{try{await fetch(N(t,"/api/auth/logout"),{method:"POST",credentials:"include",headers:{Accept:"application/json"}})}catch{}await l()};return l(),u({class:"panel"},y({class:()=>e.val==="error"?"status is-error":"status",hidden:()=>e.val==="signed-in"||e.val==="signed-out"},r),u({class:"profile",hidden:()=>e.val!=="signed-in"||a.val==null},u({class:"profile-header"},B({class:"heading"},"Profile"),y({class:"lead"},"You are signed in to Pro.")),u({class:"profile-identity"},u({class:"avatar","aria-hidden":"true"},()=>(a.val?R(a.val):"?").slice(0,1).toUpperCase()),u(y({class:"profile-name"},()=>a.val?R(a.val):""),y({class:"profile-email"},()=>{var n;return((n=a.val)==null?void 0:n.email)||""}))),ot({class:"details"},u(V("User ID"),E(()=>{var n;return((n=a.val)==null?void 0:n.id)||"—"})),u(V("Organization"),E(()=>{var n;return((n=a.val)==null?void 0:n.organizationId)||"—"})),u(V("Role"),E(()=>{const n=a.val;if(!n)return"—";const o=ft(n);return o.length?_({class:"chip-row"},...o.map(d=>_({class:"chip"},d))):"—"})),u(V("Permissions"),E(()=>{var o;const n=((o=a.val)==null?void 0:o.permissions)??[];return n.length?_({class:"chip-row"},...n.map(d=>_({class:"chip"},d))):"—"}))),u({class:"actions"},O({type:"button",class:"btn btn-secondary",onclick:()=>void g()},"Sign out"))),u({class:"login",hidden:()=>e.val==="signed-in"||e.val==="loading"},u({class:"login-header"},B({class:"heading"},"Sign in"),y({class:"lead"},"Continue to Pro to sign in with a one-time email code. You will return here afterward.")),u({class:"actions"},O({type:"button",class:"btn btn-primary",onclick:L},"Sign in with Pro"))),u({class:"tools"},O({type:"button",class:"btn btn-secondary",onclick:()=>void l()},"Refresh"),O({type:"button",class:"btn btn-secondary",onclick:()=>void C()},"Test protected"),_({class:"origin-hint",title:k},()=>`Origin: ${k}`)),st({class:"raw",hidden:()=>s.val==null},()=>s.val??""))}function X(t){if(!(t instanceof HTMLElement)||t.getAttribute(K)!=null)return null;dt();const e=ct(t),r=ht();return e.origin&&r.setAttribute("data-origin",e.origin),t.replaceWith(r),p.add(r,mt(e.origin)),r}function Z(t){const e=t||document;if(!e||!("querySelectorAll"in e))return[];const r=e.querySelectorAll("pre.auth"),a=[];for(const s of r){if(!(s instanceof HTMLElement))continue;const i=X(s);i&&a.push(i)}return a}typeof document<"u"&&Z(),z.mountAuth=X,z.scanAndMountAuths=Z,Object.defineProperty(z,Symbol.toStringTag,{value:"Module"})})(this.auth=this.auth||{});
