import van from "vanjs-core";
import { tag } from "./dom";
import { globals } from "./globals";
import type { BookActivity, Course, CourseSelectPayload } from "./types";

const { a, button, details, div, li, p, span, summary, ul } = van.tags;

/**
 * Formats non-learner role labels for display in the menu course list.
 * @param course - Course membership.
 */
function courseRoleLabel(course: Pick<Course, "role" | "roles">): string {
  const roles =
    Array.isArray(course.roles) && course.roles.length > 0
      ? course.roles
      : course.role
        ? [course.role]
        : [];
  const visible = roles.filter(
    (role: string) =>
      typeof role === "string" && role.trim() && role.trim().toLowerCase() !== "learner",
  );
  return visible.length > 0 ? visible.join(", ") : "";
}

/**
 * Extracts a book slug from an availabooks.com host or blog URL.
 * @param hostOrUrl - Hostname or URL like sql.availabooks.com.
 */
export function bookSlugFromHost(hostOrUrl: string | null | undefined): string | null {
  if (!hostOrUrl || typeof hostOrUrl !== "string") {
    return null;
  }
  let host = hostOrUrl.trim().toLowerCase();
  try {
    if (host.includes("://")) {
      host = new URL(host).hostname;
    }
  } catch {
    // keep host as trimmed string
  }
  host = host.split("/")[0];
  const suffix = ".availabooks.com";
  if (!host.endsWith(suffix)) {
    return null;
  }
  const slug = host.slice(0, -suffix.length);
  return slug && !slug.includes(".") ? slug : null;
}

/** Returns the slug for the book the user is viewing (subdomain of availabooks.com). */
export function currentBookSlug(): string | null {
  const fromBlog = bookSlugFromHost(globals.bookInfo?.blogUrl);
  if (fromBlog) {
    return fromBlog;
  }
  return bookSlugFromHost(location.hostname);
}

/**
 * Returns the book slugs attached to a course.
 * @param course - Course membership from the API.
 */
export function courseBookSlugs(course: Pick<Course, "book">): string[] {
  return Array.isArray(course.book)
    ? course.book.filter((slug: string) => typeof slug === "string" && slug.trim())
    : [];
}

/**
 * Finds the first enrolled course that includes the given book slug.
 * @param courses - Course memberships.
 * @param bookSlug - Book slug to match.
 */
function firstCourseWithBook(courses: Course[], bookSlug: string): Course | null {
  return courses.find((course: Course) => courseBookSlugs(course).includes(bookSlug)) || null;
}

/**
 * Copies course-select API fields onto globals.user.
 * @param payload - Select response or clear payload.
 */
function applyCourseSelection(payload: CourseSelectPayload): void {
  if (!globals.user) {
    return;
  }
  globals.user.organizationId = payload.organizationId ?? null;
  globals.user.role = payload.role ?? null;
  globals.user.roles = Array.isArray(payload.roles) ? payload.roles : [];
  globals.user.permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
}

/** Clears the active course on the client so the menu shows no current course. */
function clearActiveCourse(): void {
  applyCourseSelection({
    organizationId: null,
    role: null,
    roles: [],
    permissions: [],
  });
  globals.bookActivity = null;
  globals.trackBookActivity = false;
}

/**
 * Selects a course organization via the API without navigating to a book.
 * @param organizationId - WorkOS organization id.
 */
async function selectCourseOrganization(organizationId: string): Promise<boolean> {
  const response = await fetch(globals.appUrl + "/api/auth/course/select", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ organizationId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== "selected") {
    console.error("Could not select course", payload);
    return false;
  }
  applyCourseSelection(payload);
  return true;
}

/**
 * Returns a location hash for a saved section, or "" for section 1 / missing.
 * @param section - Saved section id or number.
 */
export function bookSectionHash(section: string | undefined): string {
  if (!section || section === "1") {
    return "";
  }
  const numbered = parseInt(section, 10);
  if (String(numbered) === section && numbered >= 1) {
    return "#section-" + numbered;
  }
  if (section === "section-1") {
    return "";
  }
  return "#" + section;
}

/**
 * Builds the public URL for a course book, optionally at a saved chapter/section.
 * @param slug - Book slug (subdomain of availabooks.com).
 * @param position - Saved position for the book.
 */
export function bookUrl(
  slug: string,
  position?: { chapter?: string; section?: string; path?: string } | null,
) {
  const base = `https://${slug}.availabooks.com`;
  const path =
    typeof position?.path === "string" &&
    position.path.startsWith("/") &&
    !position.path.includes("://")
      ? position.path
      : "/";
  const hash = path === "/" ? "" : bookSectionHash(position?.section);
  return base + path + hash;
}

/** Returns the chapter id from the current page path (e.g. "3" from "/y/m/3.html"). */
export function currentChapterId(): string | null {
  const file = window.location.pathname.split("/").pop() || "";
  const id = file.split(".")[0];
  if (!id || id === "toc") {
    return null;
  }
  return id;
}

/** Returns the currently visible chapter-section number, or null. */
export function currentlyVisibleSection(): number | null {
  for (const elem of document.querySelectorAll(".chapter-section")) {
    if (!(elem instanceof HTMLElement)) continue;
    if (elem.style.display !== "none") {
      const n = parseInt(elem.id.split("-")[1], 10);
      if (!isNaN(n)) {
        return n;
      }
    }
  }
  return null;
}

/**
 * Returns the current section marker: numbered `.chapter-section` when present,
 * otherwise the location hash id, otherwise "1".
 */
export function currentSectionId(): string {
  const visible = currentlyVisibleSection();
  if (visible) {
    return String(visible);
  }
  const hash = (window.location.hash || "").replace(/^#/, "").trim();
  if (hash) {
    return hash;
  }
  return "1";
}

/**
 * Fetches book activity for a course organization.
 * @param organizationId - WorkOS organization id.
 */
export async function fetchBookActivity(organizationId: string): Promise<BookActivity | null> {
  const response = await fetch(
    globals.appUrl + "/api/courses/" + encodeURIComponent(organizationId) + "/book-activity",
    { credentials: "include" },
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.activity && typeof data.activity === "object" ? data.activity : null;
}

/**
 * Saves last chapter/section for the current book in the active course.
 * @param position - Position to store.
 */
async function putBookActivity(position: {
  book: string;
  chapter: string;
  section: string;
  path?: string;
}): Promise<BookActivity | null> {
  const organizationId = globals.user?.organizationId;
  if (!organizationId) {
    console.warn("book-activity: skip save, no organizationId");
    return null;
  }
  const response = await fetch(
    globals.appUrl + "/api/courses/" + encodeURIComponent(organizationId) + "/book-activity",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(position),
    },
  );
  if (!response.ok) {
    console.error("Could not save book activity", await response.json().catch(() => ({})));
    return null;
  }
  const data = await response.json();
  if (data.activity && typeof data.activity === "object") {
    globals.bookActivity = data.activity;
  }
  return data.activity ?? null;
}

/**
 * Debounces saving the current reading position (30s after the last change).
 * @param section - Section to store; defaults to currentSectionId().
 */
export function scheduleBookActivitySave(section?: string): void {
  if (!globals.trackBookActivity) {
    return;
  }
  if (!globals.user?.id || !globals.user?.organizationId) {
    return;
  }
  const book = currentBookSlug();
  const chapter = currentChapterId();
  const sectionId = section == null || section === "" ? currentSectionId() : String(section);
  const path = window.location.pathname;
  if (!book || !chapter || !sectionId) {
    console.warn("book-activity: skip save", { book, chapter, section: sectionId });
    return;
  }

  if (globals.bookActivitySaveTimer) {
    clearTimeout(globals.bookActivitySaveTimer);
  }
  globals.bookActivitySaveTimer = setTimeout(() => {
    globals.bookActivitySaveTimer = null;
    console.log("book-activity: saving", { book, chapter, section: sectionId, path });
    void putBookActivity({ book, chapter, section: sectionId, path });
  }, 30_000);
}

/** Loads book activity for the active course so later section changes can be saved. */
export async function syncBookActivityForActiveCourse(): Promise<void> {
  globals.trackBookActivity = false;
  globals.bookActivity = null;

  const organizationId = globals.user?.organizationId;
  if (!globals.user?.id || !organizationId) {
    return;
  }

  const activity = await fetchBookActivity(organizationId);
  globals.bookActivity = activity || { lastByBook: {} };

  globals.trackBookActivity = true;
  scheduleBookActivitySave();
}

/**
 * Auto-selects (or clears) the active course so it matches the current book.
 * @param courses - Course memberships.
 */
async function syncActiveCourseToCurrentBook(courses: Course[]): Promise<void> {
  if (!globals.user?.id) {
    return;
  }
  const bookSlug = currentBookSlug();
  if (!bookSlug) {
    return;
  }

  const organizationId = globals.user.organizationId ?? null;
  const current = organizationId
    ? courses.find((course: Course) => course.workosOrganizationId === organizationId)
    : null;
  const currentMatches = Boolean(current && courseBookSlugs(current).includes(bookSlug));
  if (currentMatches) {
    return;
  }

  const match = firstCourseWithBook(courses, bookSlug);

  if (!organizationId) {
    if (!match) {
      return;
    }
    await selectCourseOrganization(match.workosOrganizationId);
    return;
  }

  if (match) {
    await selectCourseOrganization(match.workosOrganizationId);
    return;
  }

  clearActiveCourse();
}

/** Fetches courses for the signed-in user. Returns [] when unauthenticated. */
async function getCourses(): Promise<Course[]> {
  const response = await fetch(globals.appUrl + "/api/courses", {
    credentials: "include",
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data.courses) ? data.courses : [];
}

/**
 * Renders per-book switch/open buttons for a course.
 * @param course - Course membership.
 * @param isCurrentCourse - Whether this course is the session org.
 */
function renderCourseBookButtons(course: Course, isCurrentCourse: boolean): HTMLElement | "" {
  const orgId = course.workosOrganizationId;
  const books = courseBookSlugs(course);
  const activeSlug = currentBookSlug();
  const courseTitle = course.title || "this course";

  if (books.length === 0) {
    if (isCurrentCourse) {
      return "";
    }
    return div(
      { class: "menu-course-books" },
      button(
        {
          type: "button",
          class: "menu-course-select menu-course-select-plain",
          "data-menu-course-select": "",
          "data-organization-id": orgId,
          title: `Switch to ${courseTitle}`,
        },
        "Switch",
      ),
    );
  }

  return div(
    { class: "menu-course-books" },
    ...books.map((slug: string) => {
      const destination = bookUrl(slug);
      const isHere = activeSlug === slug;
      if (isHere) {
        return button(
          {
            type: "button",
            class: "menu-course-select menu-course-select-current",
            disabled: true,
            "aria-current": "true",
            title: `You are already viewing ${destination}`,
          },
          slug,
        );
      }
      const title = isCurrentCourse
        ? `Go to ${destination}`
        : `Switch to ${courseTitle} and go to ${destination}`;
      return button(
        {
          type: "button",
          class: "menu-course-select",
          "data-menu-course-select": "",
          "data-organization-id": orgId,
          "data-book-slug": slug,
          title,
        },
        slug,
      );
    }),
  );
}

/**
 * Renders one course row for the menu course picker dropdown.
 * @param course - Course membership.
 * @param isCurrentCourse - Whether this course is the session org.
 */
function renderMenuCourseItem(course: Course, isCurrentCourse: boolean): HTMLElement {
  const roleLabel = courseRoleLabel(course);
  const roleParts = [roleLabel, isCurrentCourse ? "Current" : ""].filter(Boolean);
  const books = courseBookSlugs(course);
  const firstBook = books[0] || "";
  const orgId = course.workosOrganizationId;
  const courseTitle = course.title || "Untitled course";
  const rowTitle = firstBook
    ? `Switch to ${courseTitle} and go to ${bookUrl(firstBook)}`
    : `Switch to ${courseTitle}`;

  const metaChildren: (string | HTMLElement)[] = [
    span({ class: "menu-course-title" }, courseTitle),
  ];
  if (roleParts.length) {
    metaChildren.push(span({ class: "menu-course-role" }, roleParts.join(" · ")));
  }

  const bookButtons = renderCourseBookButtons(course, isCurrentCourse);
  const attrs: Record<string, string | number | boolean> = {
    class: "menu-course" + (isCurrentCourse ? " menu-course-current" : ""),
    "data-menu-course-select": "",
    "data-organization-id": orgId,
    title: rowTitle,
    role: "button",
    tabindex: 0,
  };
  if (firstBook) {
    attrs["data-book-slug"] = firstBook;
  }

  return li(
    attrs,
    div({ class: "menu-course-meta" }, ...metaChildren),
    ...(bookButtons ? [bookButtons] : []),
  );
}

/**
 * Renders the current course name with a dropdown of other available courses.
 * @param container - Menu courses root element.
 * @param courses - Course memberships.
 */
function renderMenuCourses(container: HTMLElement, courses: Course[]): void {
  const organizationId = globals.user?.organizationId ?? null;

  if (!courses.length) {
    container.replaceChildren();
    van.add(container, p({ class: "menu-courses-hint" }, "You are not enrolled in any courses yet."));
    return;
  }

  const current = courses.find((course) => course.workosOrganizationId === organizationId);
  const others = courses.filter(
    (course: Course) => course.workosOrganizationId !== organizationId,
  );
  const currentTitle = current?.title || "Select a course";
  const hasDropdown = others.length > 0 || !current;

  const dropdownCourses = current ? others : courses;
  const currentBooks =
    current && courseBookSlugs(current).length > 0
      ? renderCourseBookButtons(current, true)
      : "";

  container.replaceChildren();

  if (!hasDropdown) {
    van.add(
      container,
      div(
        { class: "menu-courses-picker" },
        div(
          { class: "menu-courses-current" },
          span({ class: "menu-courses-current-name" }, currentTitle),
          ...(currentBooks ? [currentBooks] : []),
        ),
      ),
    );
    return;
  }

  van.add(
    container,
    details(
      { class: "menu-courses-picker" },
      summary(
        { class: "menu-courses-current" },
        span({ class: "menu-courses-current-name" }, currentTitle),
        ...(currentBooks ? [currentBooks] : []),
        span(
          { class: "material-symbols-outlined menu-courses-chevron", "aria-hidden": "true" },
          "expand_more",
        ),
      ),
      ul(
        { class: "menu-courses-list" },
        ...dropdownCourses.map((course) =>
          renderMenuCourseItem(course, course.workosOrganizationId === organizationId),
        ),
      ),
    ),
  );
}

/**
 * Selects a course organization, then opens the chosen book when provided.
 * @param organizationId - WorkOS organization id.
 * @param trigger - Switch/open control that was clicked.
 * @param bookSlug - Book slug to open after switching, if any.
 */
async function selectMenuCourse(
  organizationId: string,
  trigger: HTMLElement,
  bookSlug: string | null,
): Promise<void> {
  let feedbackButton: HTMLButtonElement | null =
    trigger instanceof HTMLButtonElement ? trigger : null;
  if (!feedbackButton) {
    const buttons = [
      ...trigger.querySelectorAll("button[data-menu-course-select]"),
    ] as HTMLButtonElement[];
    feedbackButton =
      (bookSlug
        ? buttons.find((b) => b.getAttribute("data-book-slug") === bookSlug)
        : null) ||
      buttons[0] ||
      null;
  }

  const originalLabel = feedbackButton ? feedbackButton.textContent : null;
  if (feedbackButton) {
    feedbackButton.disabled = true;
    feedbackButton.setAttribute("aria-busy", "true");
    feedbackButton.setAttribute("aria-label", bookSlug ? "Opening book" : "Switching course");
    feedbackButton.replaceChildren();
    van.add(
      feedbackButton,
      span(
        {
          class: "material-symbols-outlined menu-course-select-spinner",
          "aria-hidden": "true",
        },
        "progress_activity",
      ),
    );
  }
  if (!(trigger instanceof HTMLButtonElement)) {
    trigger.setAttribute("aria-busy", "true");
    trigger.classList.add("menu-course-selecting");
  }

  /** Restores the trigger after a failed switch/open. */
  function restoreTrigger(): void {
    if (feedbackButton) {
      feedbackButton.disabled = false;
      feedbackButton.removeAttribute("aria-busy");
      feedbackButton.removeAttribute("aria-label");
      feedbackButton.textContent = originalLabel || bookSlug || "Switch";
    }
    if (!(trigger instanceof HTMLButtonElement)) {
      trigger.removeAttribute("aria-busy");
      trigger.classList.remove("menu-course-selecting");
    }
  }

  try {
    const alreadySelected = globals.user?.organizationId === organizationId;
    if (!alreadySelected) {
      const selected = await selectCourseOrganization(organizationId);
      if (!selected) {
        restoreTrigger();
        return;
      }
    }

    if (bookSlug) {
      const activity = await fetchBookActivity(organizationId);
      const position = activity?.lastByBook?.[bookSlug] ?? null;
      window.location.href = bookUrl(bookSlug, position);
      return;
    }

    await updateMenuCourses();
  } catch (err) {
    console.error(err);
    restoreTrigger();
  }
}

/** Wires click handling for selecting a course from the side menu. */
export function bindMenuCourses(): void {
  const container = tag("menu-courses");
  if (!container || container.dataset.bound === "true") {
    return;
  }
  container.dataset.bound = "true";

  /**
   * Handles a course/book select trigger from click or keyboard.
   * @param event - Click or keydown event.
   * @param selectEl - Element with data-menu-course-select.
   */
  function activateMenuCourseSelect(event: Event, selectEl: HTMLElement): void {
    if (selectEl instanceof HTMLButtonElement && selectEl.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const organizationId = selectEl.getAttribute("data-organization-id");
    if (!organizationId) {
      return;
    }
    const bookSlug = selectEl.getAttribute("data-book-slug");
    void selectMenuCourse(organizationId, selectEl, bookSlug);
  }

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const selectEl = target.closest("[data-menu-course-select]");
    if (!(selectEl instanceof HTMLElement)) {
      return;
    }
    activateMenuCourseSelect(event, selectEl);
  });

  container.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (!(target instanceof HTMLLIElement) || !target.hasAttribute("data-menu-course-select")) {
      return;
    }
    activateMenuCourseSelect(event, target);
  });
}

/** Loads courses for the signed-in user and renders them in the side menu. */
export async function updateMenuCourses(): Promise<void> {
  const container = tag("menu-courses");
  if (!container) {
    return;
  }

  if (!globals.user || !globals.user.id) {
    container.replaceChildren();
    van.add(
      container,
      p(
        { class: "menu-courses-hint" },
        a(
          {
            href: "#",
            onclick: (evt: Event) => {
              evt.preventDefault();
              window.handleLogin();
            },
          },
          "Log in",
        ),
        " to see your courses.",
      ),
    );
    return;
  }

  container.replaceChildren();
  van.add(container, p({ class: "menu-courses-hint" }, "Loading…"));

  try {
    const courses = await getCourses();
    globals.courses = courses;
    await syncActiveCourseToCurrentBook(courses);
    await syncBookActivityForActiveCourse();
    renderMenuCourses(container, courses);
  } catch (err) {
    console.error(err);
    container.replaceChildren();
    van.add(container, p({ class: "menu-courses-hint" }, "Could not load courses."));
  }
}
