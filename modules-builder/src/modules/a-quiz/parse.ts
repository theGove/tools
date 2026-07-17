export type QuizChoice = {
  key: string;
  text: string;
  correct: boolean;
};

export type QuizQuestion = {
  prompt: string;
  choices: QuizChoice[];
  /** Optional explanation shown after the learner checks their answer. */
  correctMessage?: string;
};

const QUESTION_RE = /^(\d+)\.\s+(.+)$/;
const CHOICE_RE = /^(\*)?([A-Za-z])\)\s+(.+)$/;
const CORRECT_MESSAGE_RE = /^>\s+(.+)$/;

/**
 * Parses plain-text quiz markup into structured questions.
 * Expected shape per question:
 *   1. Prompt text
 *   a) Choice
 *   *b) Correct choice
 *   c) Choice
 *   > Optional correct message (shown after check, right or wrong)
 * @param {string} source - Raw quiz text from the element's children.
 */
export function parseQuizText(source: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let current: QuizQuestion | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const questionMatch = QUESTION_RE.exec(line);
    if (questionMatch) {
      current = {
        prompt: questionMatch[2]!.trim(),
        choices: [],
      };
      questions.push(current);
      continue;
    }

    const choiceMatch = CHOICE_RE.exec(line);
    if (choiceMatch) {
      if (!current) {
        throw new Error(`Choice "${line}" appeared before any question.`);
      }
      current.choices.push({
        correct: Boolean(choiceMatch[1]),
        key: choiceMatch[2]!.toLowerCase(),
        text: choiceMatch[3]!.trim(),
      });
      continue;
    }

    const messageMatch = CORRECT_MESSAGE_RE.exec(line);
    if (messageMatch) {
      if (!current) {
        throw new Error(`Correct message "${line}" appeared before any question.`);
      }
      if (current.choices.length === 0) {
        throw new Error(
          `Correct message for "${current.prompt}" appeared before any choices.`,
        );
      }
      const message = messageMatch[1]!.trim();
      current.correctMessage = current.correctMessage
        ? `${current.correctMessage} ${message}`
        : message;
      continue;
    }

    throw new Error(`Unrecognized quiz line: "${line}"`);
  }

  for (const [index, question] of questions.entries()) {
    if (question.choices.length === 0) {
      throw new Error(`Question ${index + 1} has no choices.`);
    }
    if (!question.choices.some((choice) => choice.correct)) {
      throw new Error(`Question ${index + 1} has no correct choice marked with *.`);
    }
  }

  return questions;
}

/**
 * Returns a shallow-copied array with items shuffled (Fisher–Yates).
 * @param {T[]} items - Items to shuffle.
 */
export function shuffleItems<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}
