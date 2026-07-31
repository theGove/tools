import {
  bookSectionHash,
  currentChapterId,
  scheduleBookActivitySave,
  updateMenuCourses,
} from "./courses";
import { tag } from "./dom";
import { globals } from "./globals";
import { buildMenu } from "./menu";
import { closeMessage, message, showToast } from "./message";
import type {
  BookInfoFeed,
  BookSectionNode,
  BookUser,
  MenuToolFeed,
  MessageOptions,
  ShowToastFn,
} from "./types";

declare function loadCrossOrigin(url: string): void;
declare function injectJs(code: string): void;

declare class TurndownService {
  turndown(html: string): string;
}

declare global {
  interface Window {
    globals: typeof globals;
    lastChapterId: number;
    initialize: (bookInfoFeed: BookInfoFeed) => void;
    loadMenuTool: (x: MenuToolFeed) => void;
    hideMenu: () => void;
    showMenu: () => void;
    fontSize: (adjustment?: number) => void;
    handleLogin: () => void;
    navigate: (direction: string) => void;
    showSection: (section: number | string, recordHash?: boolean) => void;
    scroll_to: (id: string, recordHash?: boolean) => void;
    playAudio: (td: HTMLElement) => void;
    copyThisPrompt: (event: Event) => void;
    makePrompt: (evt: Event | null | undefined, props: { level: number | string }) => void;
    message: (options?: MessageOptions) => void;
    showToast: ShowToastFn;
    closeMessage: (evt?: Event) => void;
    getUserRecord: () => void;
    init: () => void;
  }
}

/** Loads the signed-in user and refreshes login + course UI in the menu. */
function getUserRecord(): void {
  fetch(globals.appUrl + "/api/auth/me", { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok. Could not get user record");
      }
      return response.json();
    })
    .then((data: { user: BookUser | null }) => {
      console.log("data", data);
      const previousOrg = globals.user?.organizationId ?? null;
      globals.user = data.user;
      // Prefer the org already selected this page load if /me has none yet.
      if (globals.user && !globals.user.organizationId && previousOrg) {
        globals.user.organizationId = previousOrg;
      }
      updateLoginButton();
      void updateMenuCourses();
    });
}

function updateLoginButton(): void {
  const loginButton = document.querySelector(".login-button");
  if (!(loginButton instanceof HTMLElement)) {
    return;
  }
  if (globals.user) {
    console.log("we are loged in");
    const name = [globals.user.firstName, globals.user.lastName].filter(Boolean).join(" ");
    loginButton.title = name || globals.user.email || "";
    loginButton.classList.add("logged-in");
  } else {
    loginButton.title = "Log in";
    loginButton.classList.remove("logged-in");
  }
}

/**
 * Gets the bookInfo from the correct location and sends it to initialize.
 * Also loads development code if running locally.
 */
function init(): void {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    alert(
      "Running on localhost. Local code and auth cookies will NOT be loaded unless you change the hostname to local.availabooks.com",
    );
  }

  if (location.hostname.startsWith("local.availabooks.com")) {
    loadCrossOrigin(`${location.origin}/tools/localCode/dev.js`);
  } else {
    loadCrossOrigin(
      `${origin}/feeds/posts/default/-/book?alt=json-in-script&max-results=1&callback=initialize`,
    );
  }
}

function initialize(bookInfoFeed: BookInfoFeed): void {
  globals.bookInfo = JSON.parse(bookInfoFeed.feed.entry[0].content.$t);
  console.log("globals.bookInfo", globals.bookInfo);

  getUserRecord();
  setVariables();
  buildMenu();
  configureBook();

  window.onscroll = setDimness;
  bindSectionScrollSpy();

  window.addEventListener("hashchange", function () {
    globals.suppressSectionScrollSpy = true;
    if (window.location.hash) {
      scroll_to(window.location.hash.substring(1));
    } else {
      showSection(1);
    }
    globals.lastScrollSectionKey = (window.location.hash || "").replace(/^#/, "");
    scheduleBookActivitySave();
    setTimeout(() => {
      globals.suppressSectionScrollSpy = false;
      globals.lastScrollSectionKey = null;
      syncHashToSectionInView();
    }, 700);
  });

  window.addEventListener("resize", setTopMargin);
  setTopMargin();
  if (window.location.hash) {
    const id = window.location.hash.substring(1);
    globals.lastScrollSectionKey = id;
    globals.suppressSectionScrollSpy = true;
    scroll_to(id);
    setTimeout(() => {
      globals.suppressSectionScrollSpy = false;
      globals.lastScrollSectionKey = null;
      syncHashToSectionInView();
    }, 700);
  } else {
    showSection(1);
    syncHashToSectionInView();
  }
}

function configureBook(): void {
  document.body.style.setProperty("--font-zoom", String(globals.variables.fontZoom ?? 1));
}

function setVariables(): void {
  const pathArray = window.location.pathname.split("/");
  globals.variables.year = pathArray[1];
  globals.variables.month = pathArray[2];

  const storedVariables = localStorage.getItem("book-settings");
  if (storedVariables === null) {
    globals.variables.fontZoom = 1;
    localStorage.setItem(`book-settings`, JSON.stringify(globals.variables));
  } else {
    globals.variables = JSON.parse(storedVariables);
  }
}

function setDimness(): void {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop < 20 || Math.abs(scrollTop + clientHeight - scrollHeight) < 5) {
    dimButtons("bright");
    dimHeader("bright");
  } else {
    dimButtons("dim");
    dimHeader("dim");
  }
}

function setTopMargin(): void {
  const header = document.getElementsByTagName("header")[0];
  if (header) {
    const margin = header.offsetHeight;
    for (const section of document.querySelectorAll(".chapter-section")) {
      if (!(section instanceof HTMLElement)) continue;
      section.style.marginTop = `calc((${margin * 1.1}px  * var(--font-zoom))`;
    }
  }
}

/**
 * Scrolls to the specified element, being sure it is visible.
 * @param id - Element id to scroll to.
 * @param recordHash - Whether to update the location hash.
 */
function scroll_to(id: string, recordHash = true): void {
  hideMenu();
  const target = tag(id);
  if (!target) {
    return;
  }

  const sectionRoot = target.closest(".chapter-section");
  if (sectionRoot) {
    const sectionNumber = sectionRoot.id.split("-")[1];
    if (sectionNumber) {
      showSection(parseInt(sectionNumber), false);
    }
  }

  const header = document.getElementsByTagName("header")[0];
  const offset = header ? header.offsetHeight : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - offset - 8;
  window.scrollTo({ top, behavior: "smooth" });
  if (recordHash && window.location.hash !== "#" + id) {
    history.replaceState(null, "", window.location.pathname + window.location.search + "#" + id);
  }
}

function dimButtons(brightOrDim: string): void {
  for (const button of document.querySelectorAll(".nav")) {
    if (brightOrDim === "bright") {
      button.classList.remove("dim-button");
    } else {
      button.classList.add("dim-button");
    }
  }
}

function dimHeader(brightOrDim: string): void {
  for (const header of document.getElementsByTagName("header")) {
    if (brightOrDim === "bright") {
      header.classList.remove("dim-header");
    } else {
      header.classList.add("dim-header");
    }
  }
}

/**
 * Shows a chapter section by number, or 'next' / 'prior' / 'all'.
 * @param section - Section number or navigation keyword.
 * @param recordHash - Whether to update the location hash.
 */
function showSection(section: number | string, recordHash = true): void {
  let sectionsToHide: number[] = [];
  let sectionToShow: number | string = 1;
  let currentlyShowing = 0;
  const sections = document.querySelectorAll(".chapter-section");

  if (sections.length === 0) {
    return;
  }

  if (section === "all") {
    for (const elem of sections) {
      if (elem instanceof HTMLElement) elem.style.display = "block";
    }
    return;
  }

  for (const elem of sections) {
    if (!(elem instanceof HTMLElement)) continue;
    if (elem.style.display !== "none") {
      currentlyShowing = parseInt(elem.id.split("-")[1]);
      sectionsToHide.push(currentlyShowing);
    }
  }

  if (Number.isNaN(Number(section))) {
    if (section === "next") {
      sectionToShow = currentlyShowing + 1;
    } else {
      sectionToShow = currentlyShowing - 1;
    }
  } else {
    sectionToShow = section;
  }

  if (isNaN(Number(sectionToShow))) {
    return;
  }

  if (Number(sectionToShow) < 1) {
    const components = window.location.pathname.split("/");
    const priorChapter = parseInt(components[components.length - 1].split(".")[0]) - 1;
    if (priorChapter < 1) {
      window.location.href = "toc.html";
    } else {
      window.location.href = priorChapter + ".html";
      return;
    }
  } else if (Number(sectionToShow) > sections.length) {
    if (!globals.pageData.bookend) {
      globals.pageData.bookend = tag("page-data")!.dataset.bookend;
    }
    if (globals.pageData.bookend === "true") {
      message({
        text: "You have reached the end of this book.  Thank you for using Availabooks.",
        title: "Book Over",
        buttons: [],
        seconds: 8,
      });
    } else {
      const components = window.location.pathname.split("/");
      const nextChapter = parseInt(components[components.length - 1].split(".")[0]) + 1;
      window.location.href = nextChapter + ".html";
    }
    return;
  }

  for (const sectionNumber of sectionsToHide) {
    tag("section-" + sectionNumber)!.style.display = "none";
  }

  tag("section-" + sectionToShow)!.style.display = "block";

  if (sectionToShow === 1) {
    window.scrollTo(0, 0);
  } else {
    window.scrollTo(0, 25);
    if (recordHash) {
      window.location.hash = "section-" + sectionToShow;
    }
  }

  scheduleBookActivitySave(String(sectionToShow));
}

function navigate(direction: string): void {
  const path = location.pathname.replace(".", "/").split("/");

  let nextNumber = null;
  if (direction === "prior") {
    nextNumber = parseInt(path[3]) - 1;
    if (nextNumber < 1) {
      return;
    }
  } else {
    nextNumber = parseInt(path[3]) + 1;
    if (nextNumber > window.lastChapterId) {
      return;
    }
  }

  path[3] = nextNumber + "." + path.pop();
  window.location.href = path.join("/");
}

function showMenu(): void {
  let menuWidth = tag("menu")!.offsetWidth;

  if (menuWidth === 0) {
    tag("menu")!.style.display = "block";
    menuWidth = tag("menu")!.offsetWidth;
  }
  tag("menu")!.style.left = "0";
}

function hideMenu(): void {
  const menuWidth = tag("menu")!.offsetWidth;
  tag("menu")!.style.left = `-${menuWidth + 10}px`;
}

function copyThisPrompt(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const prior = target.previousElementSibling;
  if (!(prior instanceof HTMLElement)) return;

  navigator.clipboard
    .writeText(prior.innerText)
    .then(() => showToast("prompt for AI copied"))
    .catch(console.error);
}

/**
 * Collects leaf section ids from a bookInfo chapter/section tree.
 * @param node - Chapter or nested section.
 */
function flattenSectionIds(node: BookSectionNode | null | undefined): string[] {
  if (!node || !Array.isArray(node.sections)) {
    return [];
  }
  const ids: string[] = [];
  for (const child of node.sections) {
    if (!child || typeof child !== "object") {
      continue;
    }
    const section = child as BookSectionNode;
    if (Array.isArray(section.sections) && section.sections.length > 0) {
      ids.push(...flattenSectionIds(section));
    } else if (typeof section.id === "string" && section.id.trim()) {
      ids.push(section.id.trim());
    }
  }
  return ids;
}

/** Returns ordered in-chapter section elements (TOC heading ids, else .chapter-section). */
function chapterSectionElements(): HTMLElement[] {
  const chapterId = currentChapterId();
  const chapter = Array.isArray(globals.bookInfo?.chapters)
    ? globals.bookInfo.chapters.find((c) => String(c.id) === String(chapterId))
    : null;
  const fromToc = flattenSectionIds(chapter)
    .map((id: string) => tag(id))
    .filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (fromToc.length > 0) {
    return fromToc;
  }
  return [...document.querySelectorAll(".chapter-section")].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && !!el.id && el.style.display !== "none",
  );
}

/** Returns the section element id currently in view, or null for the chapter intro. */
function activeChapterSectionId(): string | null {
  const sections = chapterSectionElements();
  if (sections.length === 0) {
    return null;
  }
  const header = document.getElementsByTagName("header")[0];
  const offset = (header?.offsetHeight || 0) + 8;
  const first = sections[0];
  if (window.scrollY < 24 && first.getBoundingClientRect().top > offset + 40) {
    return null;
  }
  let active = first;
  for (const el of sections) {
    if (el.getBoundingClientRect().top <= offset) {
      active = el;
    } else {
      break;
    }
  }
  return active.id || null;
}

/** Updates the URL hash to match the section in view (no scroll jump). */
function syncHashToSectionInView(): void {
  if (globals.suppressSectionScrollSpy) {
    return;
  }
  const sectionId = activeChapterSectionId();
  const key = sectionId || "";
  if (key === globals.lastScrollSectionKey) {
    return;
  }
  globals.lastScrollSectionKey = key;
  const savedId = normalizeSectionMarker(sectionId);
  const nextHash = bookSectionHash(savedId);
  const currentHash = window.location.hash || "";
  if (currentHash !== nextHash) {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search + nextHash,
    );
  }
  scheduleBookActivitySave(savedId);
}

/**
 * Normalizes a DOM section id for activity/hash (e.g. section-3 → 3).
 * @param sectionId - Element id or marker.
 */
function normalizeSectionMarker(sectionId: string | null | undefined): string {
  if (!sectionId) {
    return "1";
  }
  const numbered = /^section-(\d+)$/.exec(sectionId);
  if (numbered) {
    return numbered[1];
  }
  return sectionId;
}

/** Binds a throttled scroll listener that keeps the hash aligned with the section in view. */
function bindSectionScrollSpy(): void {
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncHashToSectionInView();
      });
    },
    { passive: true },
  );
}

function loadMenuTool(x: MenuToolFeed): void {
  const toolId = "menu-tool-" + x.feed.entry[0].title.$t;
  const parts = x.feed.entry[0].content.$t.split(
    "==================================================",
  );

  const style = document.createElement("style");
  style.textContent = parts[0];
  document.head.appendChild(style);

  injectJs(parts[1]);

  console.log("tryoing to palce", toolId);
  tag(toolId)!.innerHTML = parts[2].trim();
}

/**
 * Adjusts the font size for the post.
 * @param adjustment - Delta to apply, or omit to reset to 1.
 */
function fontSize(adjustment?: number): void {
  if (!adjustment) {
    globals.variables.fontZoom = 1;
  } else {
    globals.variables.fontZoom =
      Math.round(((globals.variables.fontZoom ?? 1) + adjustment) * 10) / 10;
  }
  document.body.style.setProperty("--font-zoom", String(globals.variables.fontZoom ?? 1));
  localStorage.setItem(`book-settings`, JSON.stringify(globals.variables));
}

function playAudio(td: HTMLElement): void {
  let elem: HTMLElement | null = td;
  while (elem && elem.className !== "audio-control") {
    elem = elem.parentElement;
  }
  if (!elem) return;
  const audioDataUrl = elem.id + ".html";

  fetch(audioDataUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      const base64String = html.split("~~~~")[1];
      const mimeType = "audio/mpeg";
      const audioSrc = `data:${mimeType};base64,${base64String}`;

      const audioEl = document.createElement("audio");
      audioEl.playbackRate = 2;
      audioEl.controls = true;
      audioEl.src = audioSrc;
      td.replaceChildren("");

      elem.replaceChildren(audioEl);
      audioEl.addEventListener("ended", () => {
        const audioTag: HTMLElement | null = tag(elem.dataset.next || "");
        if (!audioTag) {
          return;
        }
        const nextChild = audioTag.firstElementChild;
        if (!(nextChild instanceof HTMLElement)) {
          return;
        }
        nextChild.scrollIntoView({ behavior: "smooth" });
        if (nextChild.tagName.toLowerCase() === "audio" && nextChild instanceof HTMLAudioElement) {
          nextChild.currentTime = 0;
          void nextChild.play();
        } else {
          nextChild.click();
        }
      });
      audioEl
        .play()
        .then(() => {})
        .catch((e) => {
          console.log("Could not play audio. Check the console for an Autoplay Policy error.");
          console.error("Audio play error:", e);
        });
    })
    .catch((error) => {
      console.error(error);
    });
}

function makePrompt(evt: Event | null | undefined, props: { level: number | string }): void {
  if (evt) {
    let elem: Element | null = evt.target as Element;
    const html: string[] = [];
    while (elem && elem.tagName !== "H" + props.level) {
      elem = elem.previousElementSibling;
      if (!elem) break;
      if (elem.tagName === "DIV" && elem.className === "monaco") {
        continue;
      }
      html.unshift(elem.outerHTML);
    }
    if (!elem) return;
    const turndownService = new TurndownService();
    const prompt = [
      "I'm learning about javascript.  Please help me understand it by giving me three options: Walk me through the main points, Give me different examples covering the same content, or quizzing me on the main points.  Here's the text of the section:",
    ];
    prompt.push(turndownService.turndown(html.join("")));

    prompt.push(
      "Here's the table of content from the book so you can know what i've already learned and what else is coming up",
    );
    prompt.push(tag("toc")!.innerText.split("\n\n\n").join("\n").split("\n\n").join("\n"));

    navigator.clipboard
      .writeText(prompt.join("\n\n"))
      .then(() => console.log("Copied!"))
      .catch((err) => console.error("Failed:", err));
  }
}

function handleLogin(): void {
  window.location.href = getUrl(
    globals.systemUrl + "/2000/02/login.html?next=" + encodeURI(location.href),
  );
}

function getUrl(url: string): string {
  return url;
}

// Expose APIs that HTML inline handlers and JSONP callbacks expect on window.
window.globals = globals;
window.initialize = initialize;
window.loadMenuTool = loadMenuTool;
window.hideMenu = hideMenu;
window.showMenu = showMenu;
window.fontSize = fontSize;
window.handleLogin = handleLogin;
window.navigate = navigate;
window.showSection = showSection;
window.scroll_to = scroll_to;
window.playAudio = playAudio;
window.copyThisPrompt = copyThisPrompt;
window.makePrompt = makePrompt;
window.message = message;
window.showToast = showToast;
window.closeMessage = closeMessage;
window.getUserRecord = getUserRecord;
window.init = init;

init();
