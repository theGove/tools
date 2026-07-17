/*
 * Generated file — do not edit directly.
 * Source: webcomponents/src/components/a-quiz/
 * Rebuild: cd webcomponents && npm run build
 */
(function(p){"use strict";const S=/^(\d+)\.\s+(.+)$/,x=/^(\*)?([A-Za-z])\)\s+(.+)$/,$=/^>\s+(.+)$/;function E(t){const e=[];let o=null;for(const n of t.split(/\r?\n/)){const r=n.trim();if(!r)continue;const c=S.exec(r);if(c){o={prompt:c[2].trim(),choices:[]},e.push(o);continue}const i=x.exec(r);if(i){if(!o)throw new Error(`Choice "${r}" appeared before any question.`);o.choices.push({correct:!!i[1],key:i[2].toLowerCase(),text:i[3].trim()});continue}const s=$.exec(r);if(s){if(!o)throw new Error(`Correct message "${r}" appeared before any question.`);if(o.choices.length===0)throw new Error(`Correct message for "${o.prompt}" appeared before any choices.`);const a=s[1].trim();o.correctMessage=o.correctMessage?`${o.correctMessage} ${a}`:a;continue}throw new Error(`Unrecognized quiz line: "${r}"`)}for(const[n,r]of e.entries()){if(r.choices.length===0)throw new Error(`Question ${n+1} has no choices.`);if(!r.choices.some(c=>c.correct))throw new Error(`Question ${n+1} has no correct choice marked with *.`)}return e}function A(t){const e=t.slice();for(let o=e.length-1;o>0;o-=1){const n=Math.floor(Math.random()*(o+1)),r=e[o];e[o]=e[n],e[n]=r}return e}const g="data-a-quiz-mounted",z=`
:host {
  display: block;
  font: 1rem/1.5 system-ui, sans-serif;
  color: #1a1a1a;
}

.quiz {
  display: grid;
  gap: 1rem;
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

.result[hidden] {
  display: none;
}

.error {
  margin: 0;
  color: #c62828;
}
`;function f(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function C(t){return(t.querySelector("code")||t).textContent??""}function b(t){return t.hasAttribute("randomize")||t.hasAttribute("data-randomize")}function M(t){const e=document.createElement("div");return e.className="a-quiz",e.setAttribute(g,""),b(t)&&e.setAttribute("data-randomize",t.getAttribute("data-randomize")??""),e}function y(t){if(t.shadowRoot)return t.shadowRoot;const e=t.attachShadow({mode:"open"}),o=document.createElement("style");return o.textContent=z,e.append(o),e}function v(t){var e;return(e=t.choices.find(o=>o.correct))==null?void 0:e.key}function L(t,e,o){const n=e+1,r=`q${n}`,c=t.choices.map(s=>{const a=`${r}-${s.key}`;return`
          <li class="choice" data-choice-key="${f(s.key)}">
            <input type="radio" id="${a}" name="${r}" value="${f(s.key)}" />
            <label for="${a}"><strong>${f(s.key)})</strong> ${f(s.text)}</label>
          </li>
        `}).join(""),i=t.correctMessage?`<p class="correct-message" data-correct-message hidden>${f(t.correctMessage)}</p>`:"";return`
      <p class="progress">Question ${n} of ${o}</p>
      <section class="question" data-question-index="${e}">
        <p class="prompt">${f(t.prompt)}</p>
        <ul class="choices">${c}</ul>
        <div class="feedback" data-feedback hidden>
          <p class="feedback-status" data-feedback-status></p>
          ${i}
        </div>
      </section>
    `}function T(t,e){return`
      <p class="result" data-result>Score: ${t} / ${e}</p>
    `}function H(t,e){const o=e.questions[e.index];if(!o||e.answered)return;const n=t.querySelector(".question");if(!n)return;const r=n.querySelector('input[type="radio"]:checked');if(!r)return;const c=v(o),i=!!(c&&r.value===c);i&&(e.correctCount+=1),e.answered=!0,n.querySelectorAll('input[type="radio"]').forEach(d=>{d.disabled=!0}),n.querySelectorAll(".choice").forEach(d=>{const l=d.getAttribute("data-choice-key");d.classList.toggle("is-correct-choice",l===c),d.classList.toggle("is-wrong-choice",l===r.value&&l!==c)});const s=n.querySelector("[data-feedback]"),a=n.querySelector("[data-feedback-status]"),u=n.querySelector("[data-correct-message]");s&&a&&(s.hidden=!1,s.classList.toggle("is-correct",i),s.classList.toggle("is-incorrect",!i),a.textContent=i?"Correct":"Incorrect"),u&&(u.hidden=!1),h(t,e)}function Q(t,e,o,n,r){if(n.answered){if(n.index>=n.questions.length-1){R(r,n);return}n.index+=1,n.answered=!1,q(t,e,o,n,r)}}function h(t,e,o=!1){const n=t.querySelector('[data-action="check"]'),r=t.querySelector('[data-action="next"]'),c=t.querySelector('[data-action="reset"]');if(o){n&&(n.hidden=!0),r&&(r.hidden=!0),c&&(c.hidden=!1);return}const i=t.querySelector(".question"),s=!!(i!=null&&i.querySelector('input[type="radio"]:checked')),a=e.index>=e.questions.length-1;n&&(n.hidden=e.answered,n.disabled=!s),r&&(r.hidden=!e.answered,r.textContent=a?"See results":"Next question"),c&&(c.hidden=!0)}function q(t,e,o,n,r){var s;const c=n.questions[n.index];if(!c)return;r.innerHTML=L(c,n.index,n.questions.length)+`
      <div class="actions">
        <button type="button" data-action="check" disabled>Check answer</button>
        <button type="button" data-action="next" hidden>Next question</button>
        <button type="button" data-action="reset" hidden>Restart</button>
      </div>
    `;const i=r.querySelector(".question");i==null||i.addEventListener("change",()=>{n.answered||h(r,n)}),(s=r.querySelector(".actions"))==null||s.addEventListener("click",a=>{const u=a.target;if(!(u instanceof HTMLElement))return;const d=u.getAttribute("data-action");d==="check"?H(r,n):d==="next"?Q(t,e,o,n,r):d==="reset"&&m(t,e,o)}),h(r,n)}function R(t,e){t.innerHTML=T(e.correctCount,e.questions.length)+`
      <div class="actions">
        <button type="button" data-action="check" hidden>Check answer</button>
        <button type="button" data-action="next" hidden>Next question</button>
        <button type="button" data-action="reset">Restart</button>
      </div>
    `,h(t,e,!0)}function m(t,e,o){var s,a;const n=y(t);(s=n.querySelector(".quiz"))==null||s.remove(),(a=n.querySelector(".error"))==null||a.remove();let r;try{const u=E(e);r=o?A(u):u}catch(u){const d=u instanceof Error?u.message:String(u),l=document.createElement("p");l.className="error",l.textContent=`a-quiz error: ${d}`,n.append(l);return}const c={questions:r,index:0,correctCount:0,answered:!1},i=document.createElement("div");i.className="quiz",n.append(i),i.addEventListener("click",u=>{const d=u.target;d instanceof HTMLElement&&d.getAttribute("data-action")==="reset"&&m(t,e,o)}),q(t,e,o,c,i)}function w(t){if(!(t instanceof HTMLElement)||t.getAttribute(g)!=null)return null;const e=C(t),o=b(t),n=M(t);return t.replaceWith(n),y(n),m(n,e,o),n}function k(t){const e=t||document;if(!e||!("querySelectorAll"in e))return[];const o=e.querySelectorAll("pre.a-quiz"),n=[];for(const r of o){if(!(r instanceof HTMLElement))continue;const c=w(r);c&&n.push(c)}return n}typeof document<"u"&&k(),p.mountAQuiz=w,p.scanAndMountAQuizzes=k,Object.defineProperty(p,Symbol.toStringTag,{value:"Module"})})(this.a_quiz=this.a_quiz||{});
