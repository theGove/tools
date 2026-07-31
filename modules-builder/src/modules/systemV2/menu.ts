import van from "vanjs-core";
import { bindMenuCourses, updateMenuCourses } from "./courses";
import { tag } from "./dom";
import { globals } from "./globals";
import { searchBook } from "./search";
import type { BookSectionNode } from "./types";

declare function loadCrossOrigin(url: string): void;

const { a, details, div, h6, input, span, summary } = van.tags;

/**
 * Builds an href to another chapter (or "" when linking within the current page).
 * @param path - Current location pathname.
 * @param id - Section/chapter id (may include nested markers).
 */
function newPathName(path: string, id: string): string {
  const pathArray = path.split("/");
  const fileArray = pathArray[pathArray.length - 1].split(".");
  const currentChapter = fileArray[0];
  const linkChapter = id.split("-").shift()!;

  if (linkChapter === currentChapter) {
    return "";
  }
  fileArray[0] = linkChapter;
  pathArray[pathArray.length - 1] = fileArray.join(".");
  return pathArray.join("/");
}

/**
 * Builds TOC nodes for a chapter/section tree rooted at `obj`.
 * @param obj - Chapter or nested section with children.
 */
function chapterSectionNodes(obj: BookSectionNode): HTMLElement[] {
  const label = obj.label ? obj.label + ": " : "";
  const nodes: HTMLElement[] = [
    summary(
      span(label),
      span(a({ href: newPathName(window.location.pathname, obj.id) }, obj.text ?? "")),
    ),
  ];

  for (const child of obj.sections ?? []) {
    if (child.sections) {
      nodes.push(
        div({ class: "toc-section-container" }, details(...chapterSectionNodes(child))),
      );
    } else {
      nodes.push(
        div(
          { class: "toc-text-container" },
          a(
            { href: `${newPathName(window.location.pathname, obj.id)}#${child.id}` },
            span(),
            span(child.text ?? ""),
          ),
        ),
      );
    }
  }
  return nodes;
}

/**
 * Builds one top-level TOC chapter entry (details or plain link).
 * @param chapter - Top-level bookInfo chapter.
 */
function chapterMenuNode(chapter: BookSectionNode): HTMLElement {
  if (chapter.sections) {
    const chapterNumber = window.location.pathname.split("/").pop()!.split(".")[0];
    const isCurrent = chapterNumber === chapter.id;
    if (isCurrent) {
      globals.bookInfo!.currentChapter = chapterNumber;
    }
    return details(isCurrent ? { open: true } : {}, ...chapterSectionNodes(chapter));
  }

  const label = chapter.label ? chapter.label + ": " : "";
  return div(label, a({ href: `${chapter.id}.html` }, chapter.text ?? ""));
}

/** Builds the side menu (header, courses slot, TOC, tools, search) with VanJS. */
export function buildMenu(): void {
  console.log("I'm building the menu!");

  const bookInfo = globals.bookInfo!;
  const tocChildren: HTMLElement[] = [];
  for (const chapter of bookInfo.chapters) {
    tocChildren.push(chapterMenuNode(chapter));
    window.lastChapterId = parseInt(chapter.id);
  }

  console.log("book info tools", bookInfo.tools);
  const toolSlots = bookInfo.tools.map((tool) => {
    console.log(tool);
    return div({ id: `menu-tool-${tool}` });
  });

  const menu = tag("menu")!;
  menu.replaceChildren();
  van.add(
    menu,
    div(
      { class: "menu-header" },
      span(
        {
          class: "material-symbols-outlined menu-button",
          onclick: () => window.hideMenu(),
        },
        "close",
      ),
      span({ id: "book-title" }, a({ href: "toc.html" }, bookInfo.title)),
    ),
    div(
      { id: "menu-content" },
      div({ id: "menu-courses" }),
      div({ id: "toc" }, ...tocChildren),
      div(
        { id: "tools" },
        "Text Size: ",
        span(
          {
            class: "material-symbols-outlined tool",
            onclick: () => window.fontSize(0.1),
          },
          "text_increase",
        ),
        span(
          {
            class: "material-symbols-outlined tool",
            onclick: () => window.fontSize(-0.1),
          },
          "text_decrease",
        ),
        span(
          {
            class: "material-symbols-outlined tool",
            onclick: () => window.fontSize(),
          },
          "rotate_auto",
        ),
      ),
      div(
        { id: "search-div" },
        h6("Search Book"),
        input({ id: "search", placeholder: "search book" }),
        span({ class: "material-symbols-outlined tool", id: "search-button" }, "search"),
      ),
      div({ id: "search-results" }),
      div(
        { id: "ai-tools" },
        details(summary("Tools available in this book"), div(...toolSlots)),
      ),
    ),
  );

  bindMenuCourses();
  void updateMenuCourses();

  tag("search")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchBook();
    }
  });
  tag("search-button")?.addEventListener("click", searchBook);

  for (const tool of bookInfo.tools) {
    console.log(tool);
    const toolUrl = `${globals.systemUrl}/feeds/posts/default/-/${tool}?alt=json-in-script&max-results=1&callback=loadMenuTool`;
    loadCrossOrigin(toolUrl);
  }
}
