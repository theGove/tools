import van from "vanjs-core";
import { tag } from "./dom";
import type { FeedEntry, FeedLink } from "./types";

const { a, div, span } = van.tags;

/** Finds the Blogger feed link with rel=alternate. */
function findLink(links: FeedLink[]): FeedLink | undefined {
  for (const link of links) {
    if (link.rel === "alternate") {
      return link;
    }
  }
}

/**
 * Returns snippets of `text` that contain `phrase`, with surrounding word context.
 * @param text - Full chapter plain text.
 * @param phrase - Search phrase.
 * @param contextCount - Words of context on each side.
 */
function findPhraseWithContext(text: string, phrase: string, contextCount = 10): string[] {
  const words = text.split(/\s+/);
  const phraseWords = phrase.toLowerCase().split(/\s+/);
  const results: string[] = [];

  for (let i = 0; i <= words.length - phraseWords.length; i++) {
    let match = true;
    for (let j = 0; j < phraseWords.length; j++) {
      const cleanWord = words[i + j].replace(/[^\w\s]/g, "").toLowerCase();
      if (cleanWord !== phraseWords[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      const start = Math.max(0, i - contextCount);
      const end = i + phraseWords.length + contextCount;
      results.push(words.slice(start, end).join(" "));
      i += phraseWords.length - 1;
    }
  }

  return results;
}

/**
 * Splits text into plain strings and highlighted search-term spans.
 * @param text - Snippet text.
 * @param term - Search term to highlight.
 */
function highlightSearchTerm(text: string, term: string): (string | HTMLElement)[] {
  if (!term) {
    return [text];
  }
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const parts: (string | HTMLElement)[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(span({ class: "search-term" }, match[0]));
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length > 0 ? parts : [text];
}

/**
 * Appends one chapter search result into #search-results.
 * @param entry - Blogger feed entry.
 * @param searchTerm - Query string.
 */
function buildChapterSearchResult(entry: FeedEntry, searchTerm: string): void {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = entry.content.$t;

  const resultTitleDiv = div({ class: "search-result-title" }, entry.title.$t);
  const chapterResultDiv = div({ class: "search-result" }, resultTitleDiv);

  for (const result of findPhraseWithContext(tempDiv.innerText, searchTerm, 5)) {
    console.log("result:", result);
    van.add(
      chapterResultDiv,
      div({ class: "search-result-line" }, ...highlightSearchTerm(result, searchTerm)),
    );
  }

  const href = findLink(entry.link)!.href.split("/").pop()!;
  const chapterResultLink = a(
    { class: "chapter-result-link", href, style: "color:black" },
    chapterResultDiv,
  );
  van.add(tag("search-results")!, chapterResultLink);
}

/** Runs a full-book search against the Blogger chapter feed and renders results. */
export function searchBook(): void {
  const searchInput = tag("search") as HTMLInputElement;
  fetch(
    `/feeds/posts/default?alt=json&label=chapter&v=2&orderby=relevance&max-results=100&q=label%3Achapter+${encodeURIComponent(searchInput.value)}&start-index=1&rewriteforssl=true`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data: { feed: { entry?: FeedEntry[] } }) => {
      const results = tag("search-results")!;
      results.replaceChildren();
      if (data.feed.entry) {
        for (const entry of data.feed.entry) {
          buildChapterSearchResult(entry, searchInput.value);
        }
      } else {
        van.add(results, div("No Results Found"));
      }
    });
}
