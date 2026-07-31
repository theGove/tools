import type { SystemGlobals } from "./types";

/** Mutable book-shell state (auth, courses, scroll-spy, settings). */
export const globals: SystemGlobals = {
  systemUrl: "https://system.availabooks.com",
  appUrl: "https://app.availabooks.com",
  bookInfo: null,
  pageData: {},
  variables: {},
  user: {},
  courses: [],
  bookActivity: null,
  trackBookActivity: false,
  bookActivitySaveTimer: null,
  lastScrollSectionKey: null,
  suppressSectionScrollSpy: false,
};
