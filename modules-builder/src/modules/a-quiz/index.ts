import { parseQuizText, shuffleItems, type QuizQuestion } from "./parse";

const MOUNTED_ATTR = "data-a-quiz-mounted";

const STYLES = `
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
`;

/**
 * Escapes text for safe insertion into HTML.
 * @param {string} value - Raw text value.
 */
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Reads quiz source from a nested <code> element, or the pre itself.
 * @param {HTMLElement} pre - The pre.a-quiz element.
 */
function readSourceText(pre: HTMLElement) {
  return (pre.querySelector("code") || pre).textContent ?? "";
}

/**
 * True when the pre/host has randomize enabled (bare or data- attribute).
 * @param {HTMLElement} el - Element that may carry randomize attrs.
 */
function hasRandomize(el: HTMLElement) {
  return el.hasAttribute("randomize") || el.hasAttribute("data-randomize");
}

/**
 * Builds a host div that replaces the source pre, copying randomize attrs.
 * @param {HTMLElement} pre - The pre.a-quiz element being replaced.
 */
function createHost(pre: HTMLElement) {
  const host = document.createElement("div");
  host.className = "a-quiz";
  host.setAttribute(MOUNTED_ATTR, "");
  if (hasRandomize(pre)) {
    host.setAttribute("data-randomize", pre.getAttribute("data-randomize") ?? "");
  }
  return host;
}

/**
 * Attaches an open shadow root and injects the quiz stylesheet.
 * @param {HTMLElement} host - Mounted quiz host element.
 */
function ensureShadow(host: HTMLElement) {
  if (host.shadowRoot) {
    return host.shadowRoot;
  }
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES;
  shadow.append(style);
  return shadow;
}

/**
 * Returns the key of the correct choice for a question.
 * @param {QuizQuestion} question - Question with marked choices.
 */
function correctChoiceKey(question: QuizQuestion) {
  return question.choices.find((choice) => choice.correct)?.key;
}

/**
 * Builds HTML for the currently visible question.
 * @param {QuizQuestion} question - Parsed question data.
 * @param {number} index - Zero-based display order.
 * @param {number} total - Total number of questions.
 */
function questionHtml(question: QuizQuestion, index: number, total: number) {
  const number = index + 1;
  const name = `q${number}`;
  const choices = question.choices
    .map((choice) => {
      const id = `${name}-${choice.key}`;
      return `
          <li class="choice" data-choice-key="${escapeHtml(choice.key)}">
            <input type="radio" id="${id}" name="${name}" value="${escapeHtml(choice.key)}" />
            <label for="${id}"><strong>${escapeHtml(choice.key)})</strong> ${escapeHtml(choice.text)}</label>
          </li>
        `;
    })
    .join("");

  const correctMessage = question.correctMessage
    ? `<p class="correct-message" data-correct-message hidden>${escapeHtml(question.correctMessage)}</p>`
    : "";

  return `
      <p class="progress">Question ${number} of ${total}</p>
      <section class="question" data-question-index="${index}">
        <p class="prompt">${escapeHtml(question.prompt)}</p>
        <ul class="choices">${choices}</ul>
        <div class="feedback" data-feedback hidden>
          <p class="feedback-status" data-feedback-status></p>
          ${correctMessage}
        </div>
      </section>
    `;
}

/**
 * Builds the finished-state summary after the last question.
 * @param {number} correctCount - Number of correct answers.
 * @param {number} total - Total questions answered.
 */
function summaryHtml(correctCount: number, total: number) {
  return `
      <p class="result" data-result>Score: ${correctCount} / ${total}</p>
    `;
}

type QuizState = {
  questions: QuizQuestion[];
  index: number;
  correctCount: number;
  answered: boolean;
};

/**
 * Grades the current question, shows feedback, and locks choices.
 * @param {HTMLElement} root - Quiz root inside the shadow tree.
 * @param {QuizState} state - Mutable quiz progress state.
 */
function checkCurrentAnswer(root: HTMLElement, state: QuizState) {
  const question = state.questions[state.index];
  if (!question || state.answered) {
    return;
  }

  const section = root.querySelector<HTMLElement>(".question");
  if (!section) {
    return;
  }

  const selected = section.querySelector<HTMLInputElement>(
    'input[type="radio"]:checked',
  );
  if (!selected) {
    return;
  }

  const correctKey = correctChoiceKey(question);
  const isCorrect = Boolean(correctKey && selected.value === correctKey);
  if (isCorrect) {
    state.correctCount += 1;
  }
  state.answered = true;

  section.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
    input.disabled = true;
  });

  section.querySelectorAll<HTMLElement>(".choice").forEach((choiceEl) => {
    const key = choiceEl.getAttribute("data-choice-key");
    choiceEl.classList.toggle("is-correct-choice", key === correctKey);
    choiceEl.classList.toggle(
      "is-wrong-choice",
      key === selected.value && key !== correctKey,
    );
  });

  const feedback = section.querySelector<HTMLElement>("[data-feedback]");
  const status = section.querySelector<HTMLElement>("[data-feedback-status]");
  const message = section.querySelector<HTMLElement>("[data-correct-message]");
  if (feedback && status) {
    feedback.hidden = false;
    feedback.classList.toggle("is-correct", isCorrect);
    feedback.classList.toggle("is-incorrect", !isCorrect);
    status.textContent = isCorrect ? "Correct" : "Incorrect";
  }
  if (message) {
    message.hidden = false;
  }

  updateActionButtons(root, state);
}

/**
 * Advances to the next question, or shows the final score.
 * @param {HTMLElement} host - Mounted quiz host with shadow root.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order on reset.
 * @param {QuizState} state - Mutable quiz progress state.
 * @param {HTMLElement} root - Quiz root inside the shadow tree.
 */
function goNext(
  host: HTMLElement,
  sourceText: string,
  randomize: boolean,
  state: QuizState,
  root: HTMLElement,
) {
  if (!state.answered) {
    return;
  }

  if (state.index >= state.questions.length - 1) {
    paintSummary(root, state);
    return;
  }

  state.index += 1;
  state.answered = false;
  paintQuestion(host, sourceText, randomize, state, root);
}

/**
 * Syncs Check / Next / Restart button labels and disabled state.
 * @param {HTMLElement} root - Quiz root inside the shadow tree.
 * @param {QuizState} state - Mutable quiz progress state.
 * @param {boolean} [finished] - When true, only Restart is shown.
 */
function updateActionButtons(root: HTMLElement, state: QuizState, finished = false) {
  const checkBtn = root.querySelector<HTMLButtonElement>('[data-action="check"]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-action="reset"]');

  if (finished) {
    if (checkBtn) {
      checkBtn.hidden = true;
    }
    if (nextBtn) {
      nextBtn.hidden = true;
    }
    if (resetBtn) {
      resetBtn.hidden = false;
    }
    return;
  }

  const section = root.querySelector(".question");
  const hasSelection = Boolean(
    section?.querySelector('input[type="radio"]:checked'),
  );
  const isLast = state.index >= state.questions.length - 1;

  if (checkBtn) {
    checkBtn.hidden = state.answered;
    checkBtn.disabled = !hasSelection;
  }
  if (nextBtn) {
    nextBtn.hidden = !state.answered;
    nextBtn.textContent = isLast ? "See results" : "Next question";
  }
  if (resetBtn) {
    resetBtn.hidden = true;
  }
}

/**
 * Renders the current question into an existing quiz root.
 * @param {HTMLElement} host - Mounted quiz host with shadow root.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order on reset.
 * @param {QuizState} state - Mutable quiz progress state.
 * @param {HTMLElement} root - Quiz root inside the shadow tree.
 */
function paintQuestion(
  host: HTMLElement,
  sourceText: string,
  randomize: boolean,
  state: QuizState,
  root: HTMLElement,
) {
  const question = state.questions[state.index];
  if (!question) {
    return;
  }

  root.innerHTML =
    questionHtml(question, state.index, state.questions.length) +
    `
      <div class="actions">
        <button type="button" data-action="check" disabled>Check answer</button>
        <button type="button" data-action="next" hidden>Next question</button>
        <button type="button" data-action="reset" hidden>Restart</button>
      </div>
    `;

  const section = root.querySelector(".question");
  section?.addEventListener("change", () => {
    if (!state.answered) {
      updateActionButtons(root, state);
    }
  });

  root.querySelector(".actions")?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const action = target.getAttribute("data-action");
    if (action === "check") {
      checkCurrentAnswer(root, state);
    } else if (action === "next") {
      goNext(host, sourceText, randomize, state, root);
    } else if (action === "reset") {
      renderQuiz(host, sourceText, randomize);
    }
  });

  updateActionButtons(root, state);
}

/**
 * Replaces the quiz body with the final score and a Restart control.
 * @param {HTMLElement} root - Quiz root inside the shadow tree.
 * @param {QuizState} state - Mutable quiz progress state.
 */
function paintSummary(root: HTMLElement, state: QuizState) {
  root.innerHTML =
    summaryHtml(state.correctCount, state.questions.length) +
    `
      <div class="actions">
        <button type="button" data-action="check" hidden>Check answer</button>
        <button type="button" data-action="next" hidden>Next question</button>
        <button type="button" data-action="reset">Restart</button>
      </div>
    `;
  updateActionButtons(root, state, true);
}

/**
 * Parses source text, optionally shuffles, and paints the quiz UI into the host.
 * @param {HTMLElement} host - Mounted quiz host with shadow root.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order.
 */
function renderQuiz(host: HTMLElement, sourceText: string, randomize: boolean) {
  const shadow = ensureShadow(host);
  shadow.querySelector(".quiz")?.remove();
  shadow.querySelector(".error")?.remove();

  let questions: QuizQuestion[];
  try {
    const parsed = parseQuizText(sourceText);
    questions = randomize ? shuffleItems(parsed) : parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorEl = document.createElement("p");
    errorEl.className = "error";
    errorEl.textContent = `a-quiz error: ${message}`;
    shadow.append(errorEl);
    return;
  }

  const state: QuizState = {
    questions,
    index: 0,
    correctCount: 0,
    answered: false,
  };

  const root = document.createElement("div");
  root.className = "quiz";
  shadow.append(root);

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.getAttribute("data-action") === "reset") {
      renderQuiz(host, sourceText, randomize);
    }
  });

  paintQuestion(host, sourceText, randomize, state, root);
}

/**
 * Replaces a pre.a-quiz with a mounted interactive quiz host.
 * @param {HTMLElement} pre - Source pre.a-quiz element.
 */
export function mountAQuiz(pre: HTMLElement) {
  if (!(pre instanceof HTMLElement) || pre.getAttribute(MOUNTED_ATTR) != null) {
    return null;
  }

  const sourceText = readSourceText(pre);
  const randomize = hasRandomize(pre);
  const host = createHost(pre);
  pre.replaceWith(host);
  ensureShadow(host);
  renderQuiz(host, sourceText, randomize);
  return host;
}

/**
 * Finds and mounts every unmounted pre.a-quiz under root (defaults to document).
 * @param {ParentNode} [root] - Document or subtree to scan.
 */
export function scanAndMountAQuizzes(root?: ParentNode | null) {
  const scope = root || document;
  if (!scope || !("querySelectorAll" in scope)) {
    return [];
  }
  const nodes = scope.querySelectorAll("pre.a-quiz");
  const mounted: HTMLElement[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const host = mountAQuiz(node);
    if (host) {
      mounted.push(host);
    }
  }
  return mounted;
}

if (typeof document !== "undefined") {
  scanAndMountAQuizzes();
}
