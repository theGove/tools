/** Saved reading position for one book within a course. */
export type BookPosition = {
  chapter: string;
  section: string;
  path?: string;
  updatedAt: string;
};

/** Per-user last-position map keyed by book slug. */
export type BookActivity = {
  lastByBook?: Record<string, BookPosition>;
};

/** Chapter / nested section node from bookInfo. */
export type BookSectionNode = {
  id: string;
  text?: string;
  label?: string;
  sections?: BookSectionNode[];
};

/** Top-level book metadata loaded from the Blogger "book" post. */
export type BookInfo = {
  title: string;
  blogUrl?: string;
  chapters: BookSectionNode[];
  tools: string[];
  currentChapter?: string;
};

/** Signed-in user fields used by the book shell. */
export type BookUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
};

/** Course membership row from `/api/courses`. */
export type Course = {
  id: string;
  title: string;
  workosOrganizationId: string;
  book?: string[];
  role?: string | null;
  roles?: string[];
};

/** Local storage / path-derived book UI settings. */
export type BookVariables = {
  year?: string;
  month?: string;
  fontZoom?: number;
  [key: string]: unknown;
};

/** Page-level dataset mirrored into globals. */
export type PageData = {
  bookend?: string;
  [key: string]: unknown;
};

/** Mutable runtime state shared across the book shell. */
export type SystemGlobals = {
  systemUrl: string;
  appUrl: string;
  bookInfo: BookInfo | null;
  pageData: PageData;
  variables: BookVariables;
  user: BookUser | null;
  courses: Course[];
  bookActivity: BookActivity | null;
  trackBookActivity: boolean;
  bookActivitySaveTimer: ReturnType<typeof setTimeout> | null;
  lastScrollSectionKey: string | null;
  suppressSectionScrollSpy: boolean;
};

/** Payload from POST `/api/auth/course/select`. */
export type CourseSelectPayload = {
  status?: string;
  organizationId?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
};

/** Message dialog button. */
export type MessageButton = {
  text: string;
  fn: (evt?: Event) => void;
};

/** Options for the in-page message() dialog. */
export type MessageOptions = {
  text?: string;
  title?: string;
  buttons?: MessageButton[];
  seconds?: number;
  type?: string;
  modal?: boolean;
};

/** Dialog element with optional modal overlay reference. */
export type MsgDialogElement = HTMLDivElement & {
  _msgOverlay?: HTMLDivElement | null;
};

/** Toast notification helper. */
export type ShowToastFn = (message: string, kind?: string) => void;

/** Minimal Blogger feed entry shapes used by search / JSONP. */
export type FeedLink = {
  rel: string;
  href: string;
};

export type FeedEntry = {
  title: { $t: string };
  content: { $t: string };
  link: FeedLink[];
  category?: Array<{ term: string }>;
};

export type BookInfoFeed = {
  feed: {
    entry: FeedEntry[];
  };
};

export type MenuToolFeed = {
  feed: {
    entry: FeedEntry[];
  };
};
