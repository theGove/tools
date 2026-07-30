import van from "vanjs-core";
import { parseQuizText, shuffleItems, type QuizQuestion } from "./parse";

const { button, div, input, label, li, p, section, strong, ul } = van.tags;

const MOUNTED_ATTR = "data-a-quiz-mounted";

/** Default Pro origin when none is set on the pre. Empty string = same origin. */
const DEFAULT_ORIGIN = "http://localhost:2732";

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
`;

/**
 * Reads the first non-empty attribute value from the given names.
 * @param {HTMLElement} el - Element to read attributes from.
 * @param {string[]} names - Attribute names to try in order.
 */
function readAttr(el: HTMLElement, names: string[]) {
  for (const name of names) {
    const value = el.getAttribute(name);
    if (value != null && value.trim() !== "") {
      return value.trim();
    }
  }
  return null;
}

/**
 * Reads quiz source from a nested <code> element, or the pre itself.
 * @param {HTMLElement} pre - The pre.a-quiz element.
 */
function readSourceText(pre: HTMLElement) {
  return (pre.querySelector("code") || pre).textContent ?? "";
}

/**
 * Reads Pro API origin from a pre.a-quiz (or host) element.
 * @param {HTMLElement} el - Element that may carry origin attrs.
 */
function readOrigin(el: HTMLElement) {
  const raw = readAttr(el, ["data-origin", "origin"]);
  return (raw ?? DEFAULT_ORIGIN).replace(/\/$/, "");
}

/**
 * Builds an absolute API URL under the configured Pro origin.
 * @param {string} origin - Pro origin (empty = same origin).
 * @param {string} path - Absolute API path (e.g. /api/submissions/submit).
 */
function apiUrl(origin: string, path: string) {
  if (!origin) {
    return path;
  }
  return new URL(path, `${origin}/`).toString();
}

/**
 * True when the pre/host has randomize enabled (bare or data- attribute).
 * @param {HTMLElement} el - Element that may carry randomize attrs.
 */
function hasRandomize(el: HTMLElement) {
  return el.hasAttribute("randomize") || el.hasAttribute("data-randomize");
}

/**
 * Builds a host div that replaces the source pre, copying randomize/origin attrs.
 * @param {HTMLElement} pre - The pre.a-quiz element being replaced.
 * @param {string} origin - Resolved Pro origin for submissions.
 */
function createHost(pre: HTMLElement, origin: string) {
  const host = document.createElement("div");
  host.className = "a-quiz";
  host.setAttribute(MOUNTED_ATTR, "");
  if (hasRandomize(pre)) {
    host.setAttribute("data-randomize", pre.getAttribute("data-randomize") ?? "");
  }
  if (origin) {
    host.setAttribute("data-origin", origin);
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
 * Parses and optionally shuffles quiz source text.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order.
 */
function loadQuestions(sourceText: string, randomize: boolean) {
  const parsed = parseQuizText(sourceText);
  return randomize ? shuffleItems(parsed) : parsed;
}

type QuizAnswer = {
  index: number;
  prompt: string;
  selectedKey: string;
  correctKey: string | undefined;
  correct: boolean;
};

/**
 * Builds the reactive quiz UI for one mounted host.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order on start/restart.
 * @param {string} origin - Pro origin for submission API calls.
 */
function QuizApp(sourceText: string, randomize: boolean, origin: string) {
  const parseError = van.state<string | null>(null);
  const questions = van.state<QuizQuestion[]>([]);
  const index = van.state(0);
  const correctCount = van.state(0);
  const answers = van.state<QuizAnswer[]>([]);
  const answered = van.state(false);
  const selectedKey = van.state<string | null>(null);
  const isCorrect = van.state(false);
  const finished = van.state(false);
  const submitted = van.state(false);
  const submitting = van.state(false);
  const submitMessage = van.state<string | null>(null);
  const submitFailed = van.state(false);

  /**
   * Loads questions and resets progress (used on mount and Restart).
   */
  const restart = () => {
    try {
      questions.val = loadQuestions(sourceText, randomize);
      parseError.val = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      parseError.val = message;
      questions.val = [];
    }
    index.val = 0;
    correctCount.val = 0;
    answers.val = [];
    answered.val = false;
    selectedKey.val = null;
    isCorrect.val = false;
    finished.val = false;
    submitted.val = false;
    submitting.val = false;
    submitMessage.val = null;
    submitFailed.val = false;
  };

  /**
   * Grades the current selection and locks choices.
   */
  const checkAnswer = () => {
    const question = questions.val[index.val];
    if (!question || answered.val || selectedKey.val == null) {
      return;
    }

    const correctKey = correctChoiceKey(question);
    const correct = Boolean(correctKey && selectedKey.val === correctKey);
    if (correct) {
      correctCount.val += 1;
    }
    answers.val = [
      ...answers.val,
      {
        index: index.val,
        prompt: question.prompt,
        selectedKey: selectedKey.val,
        correctKey,
        correct,
      },
    ];
    isCorrect.val = correct;
    answered.val = true;
  };

  /**
   * Advances to the next question, or shows the final score.
   */
  const goNext = () => {
    if (!answered.val) {
      return;
    }
    if (index.val >= questions.val.length - 1) {
      finished.val = true;
      return;
    }
    index.val += 1;
    answered.val = false;
    selectedKey.val = null;
    isCorrect.val = false;
  };

  /**
   * Posts the quiz result to Pro `/api/submissions/submit`.
   */
  const submitQuiz = async () => {
    if (submitted.val || submitting.val) {
      return;
    }

    submitting.val = true;
    submitFailed.val = false;
    submitMessage.val = null;

    try {
      const response = await fetch(apiUrl(origin, "/api/submissions/submit"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "a-quiz",
          score: {
            correct: correctCount.val,
            total: questions.val.length,
          },
          answers: answers.val,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode =
          payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error: unknown }).error)
            : `HTTP ${response.status}`;
        submitFailed.val = true;
        submitMessage.val =
          response.status === 401
            ? "Sign in to submit your quiz."
            : `Could not submit quiz (${errorCode}).`;
        return;
      }

      submitted.val = true;
      submitFailed.val = false;
      submitMessage.val = "Your quiz has been submitted.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      submitFailed.val = true;
      submitMessage.val = `Could not reach Pro (${message}).`;
    } finally {
      submitting.val = false;
    }
  };

  restart();

  /**
   * Renders one question with choices, feedback, and Check/Next actions.
   * @param {QuizQuestion} question - Current question.
   * @param {number} questionIndex - Zero-based display order.
   * @param {number} total - Total number of questions.
   */
  const questionView = (
    question: QuizQuestion,
    questionIndex: number,
    total: number,
  ) => {
    const number = questionIndex + 1;
    const name = `q${number}`;
    const correctKey = correctChoiceKey(question);
    const isLast = questionIndex >= total - 1;

    return [
      p({ class: "progress" }, () => `Question ${number} of ${total}`),
      section(
        { class: "question" },
        p({ class: "prompt" }, question.prompt),
        ul(
          { class: "choices" },
          ...question.choices.map((choice) => {
            const id = `${name}-${choice.key}`;
            return li(
              {
                class: () => {
                  const classes = ["choice"];
                  if (answered.val) {
                    if (choice.key === correctKey) {
                      classes.push("is-correct-choice");
                    }
                    if (
                      choice.key === selectedKey.val &&
                      choice.key !== correctKey
                    ) {
                      classes.push("is-wrong-choice");
                    }
                  }
                  return classes.join(" ");
                },
              },
              input({
                type: "radio",
                id,
                name,
                value: choice.key,
                disabled: () => answered.val,
                onchange: () => {
                  if (!answered.val) {
                    selectedKey.val = choice.key;
                  }
                },
              }),
              label(
                { for: id },
                strong(`${choice.key})`),
                ` ${choice.text}`,
              ),
            );
          }),
        ),
        div(
          {
            class: () => {
              const classes = ["feedback"];
              if (answered.val) {
                classes.push(isCorrect.val ? "is-correct" : "is-incorrect");
              }
              return classes.join(" ");
            },
            hidden: () => !answered.val,
          },
          p(
            { class: "feedback-status" },
            () => (isCorrect.val ? "Correct" : "Incorrect"),
          ),
          question.correctMessage
            ? p(
                {
                  class: "correct-message",
                  hidden: () => !answered.val,
                },
                question.correctMessage,
              )
            : null,
        ),
      ),
      div(
        { class: "actions" },
        button(
          {
            type: "button",
            "data-action": "check",
            hidden: () => answered.val,
            disabled: () => selectedKey.val == null,
            onclick: checkAnswer,
          },
          "Check answer",
        ),
        button(
          {
            type: "button",
            "data-action": "next",
            hidden: () => !answered.val,
            onclick: goNext,
          },
          isLast ? "See results" : "Next question",
        ),
      ),
    ];
  };

  /**
   * Renders the finished score plus Submit / Restart controls.
   */
  const summaryView = () =>
    [
      p(
        { class: "result" },
        () => `Score: ${correctCount.val} / ${questions.val.length}`,
      ),
      p(
        {
          class: () =>
            submitFailed.val ? "submit-status is-error" : "submit-status",
          hidden: () => submitMessage.val == null,
        },
        () => submitMessage.val ?? "",
      ),
      div(
        { class: "actions" },
        button(
          {
            type: "button",
            "data-action": "submit",
            disabled: () => submitted.val || submitting.val,
            onclick: () => void submitQuiz(),
          },
          () => {
            if (submitting.val) {
              return "Submitting…";
            }
            return submitted.val ? "Submitted" : "Submit quiz";
          },
        ),
        button(
          {
            type: "button",
            "data-action": "reset",
            onclick: restart,
          },
          "Restart",
        ),
      ),
    ];

  return div(
    { class: "quiz" },
    () => {
      if (parseError.val) {
        return p({ class: "error" }, `a-quiz error: ${parseError.val}`);
      }
      if (finished.val) {
        return div({ class: "quiz-panel" }, ...summaryView());
      }
      const question = questions.val[index.val];
      if (!question) {
        return p({ class: "error" }, "a-quiz error: no questions found");
      }
      return div(
        { class: "quiz-panel" },
        ...questionView(question, index.val, questions.val.length),
      );
    },
  );
}

/**
 * Parses source text and mounts the VanJS quiz UI into the host shadow root.
 * @param {HTMLElement} host - Mounted quiz host with shadow root.
 * @param {string} sourceText - Raw quiz markup.
 * @param {boolean} randomize - When true, shuffles question order.
 * @param {string} origin - Pro origin for submission API calls.
 */
function renderQuiz(
  host: HTMLElement,
  sourceText: string,
  randomize: boolean,
  origin: string,
) {
  const shadow = ensureShadow(host);
  shadow.querySelector(".quiz")?.remove();
  shadow.querySelector(".error")?.remove();
  van.add(shadow, QuizApp(sourceText, randomize, origin));
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
  const origin = readOrigin(pre);
  const host = createHost(pre, origin);
  pre.replaceWith(host);
  ensureShadow(host);
  renderQuiz(host, sourceText, randomize, origin);
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
