import van from "vanjs-core";

const { button, dd, div, dl, dt, h2, p, pre, span } = van.tags;

const MOUNTED_ATTR = "data-auth-mounted";
const STYLES_ATTR = "data-auth-styles";

/** Default Pro origin when none is set on the pre. Empty string = same origin. */
const DEFAULT_ORIGIN = "http://localhost:2732";

/**
 * Baseline look for `.auth`, matched to electrician book skin tokens.
 * Wrapped in `@layer availabooks-auth` so unlayered host CSS overrides easily.
 * Uses host `:root` vars when present (`--accent`, `--surface`, …).
 */
const DEFAULT_STYLES = `
@layer availabooks-auth {
  .auth {
    --auth-font: "Roboto", "Helvetica Neue", Arial, sans-serif;
    --auth-heading-font: "Taviraj", Georgia, serif;
    --auth-page-bg: var(--page-bg, #f8fafc);
    --auth-surface: var(--surface, #ffffff);
    --auth-surface-soft: var(--surface-soft, #f1f5f9);
    --auth-text: var(--text, #172033);
    --auth-muted: var(--text-muted, #64748b);
    --auth-heading: var(--heading, #0f172a);
    --auth-accent: var(--accent, #2563eb);
    --auth-accent-strong: var(--accent-strong, #1d4ed8);
    --auth-accent-soft: var(--accent-soft, #dbeafe);
    --auth-danger: var(--danger, #dc2626);
    --auth-border: var(--border, #dbe3ee);
    --auth-shadow-sm: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
    --auth-shadow-md: var(--shadow-md, 0 12px 30px rgba(15, 23, 42, 0.12));
    --auth-radius-sm: var(--radius-sm, 0.5rem);
    --auth-radius-md: var(--radius-md, 0.85rem);
    display: block;
    max-width: 26rem;
    margin: 1.5rem 0;
    font-family: var(--auth-font);
    font-size: 1rem;
    line-height: 1.55;
    color: var(--auth-text);
    -webkit-font-smoothing: antialiased;
  }

  .auth .panel {
    display: grid;
    gap: 1.15rem;
    padding: 1.35rem 1.4rem 1.25rem;
    border: 1px solid var(--auth-border);
    border-radius: var(--auth-radius-md);
    background: var(--auth-surface);
    box-shadow: var(--auth-shadow-md);
  }

  .auth .heading {
    margin: 0;
    font-family: var(--auth-heading-font);
    font-size: clamp(1.35rem, 3.5vw, 1.65rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: var(--auth-heading);
  }

  .auth .lead {
    margin: 0;
    color: var(--auth-muted);
    font-size: 0.95rem;
  }

  .auth .status {
    margin: 0;
    padding: 0.65rem 0.85rem;
    border-radius: var(--auth-radius-sm);
    background: var(--auth-surface-soft);
    border: 1px solid var(--auth-border);
    color: var(--auth-muted);
    font-size: 0.92rem;
  }

  .auth .status.is-error {
    color: var(--auth-danger);
    background: #fef2f2;
    border-color: #fecaca;
  }

  .auth .login,
  .auth .profile {
    display: grid;
    gap: 1rem;
  }

  .auth .login[hidden],
  .auth .profile[hidden],
  .auth .status[hidden],
  .auth .raw[hidden] {
    display: none !important;
  }

  .auth .login-header,
  .auth .profile-header {
    display: grid;
    gap: 0.35rem;
  }

  .auth .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
  }

  .auth button {
    font: inherit;
    cursor: pointer;
  }

  .auth .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 1rem;
    border-radius: var(--auth-radius-sm);
    border: 1px solid transparent;
    font-weight: 600;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease,
      transform 0.18s ease, box-shadow 0.18s ease;
  }

  .auth .btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .auth .btn-primary {
    background: var(--auth-accent);
    color: #fff;
    box-shadow: var(--auth-shadow-sm);
  }

  .auth .btn-primary:hover:not(:disabled) {
    background: var(--auth-accent-strong);
  }

  .auth .btn-secondary {
    background: var(--auth-surface);
    color: var(--auth-accent);
    border-color: var(--auth-border);
    box-shadow: var(--auth-shadow-sm);
  }

  .auth .btn-secondary:hover:not(:disabled) {
    background: var(--auth-accent-soft);
    border-color: #bfdbfe;
    color: var(--auth-accent-strong);
  }

  .auth button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  .auth .profile-identity {
    display: flex;
    align-items: center;
    gap: 0.95rem;
  }

  .auth .avatar {
    display: grid;
    place-items: center;
    width: 3.5rem;
    height: 3.5rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--auth-accent-soft);
    color: var(--auth-accent-strong);
    font-family: var(--auth-heading-font);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .auth .profile-name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--auth-heading);
  }

  .auth .profile-email {
    margin: 0.2rem 0 0;
    color: var(--auth-muted);
    word-break: break-word;
  }

  .auth .details {
    margin: 0;
    display: grid;
    gap: 0;
  }

  .auth .details > div {
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--auth-border);
  }

  .auth .details > div:first-child {
    padding-top: 0;
  }

  .auth .details > div:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .auth .details dt {
    margin: 0;
    color: var(--auth-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .auth .details dd {
    margin: 0;
    word-break: break-word;
  }

  .auth .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .auth .chip {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: var(--auth-accent-soft);
    color: var(--auth-accent-strong);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .auth .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding-top: 0.35rem;
    border-top: 1px solid var(--auth-border);
  }

  .auth .tools .btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .auth .origin-hint {
    margin-left: auto;
    font-size: 0.78rem;
    color: var(--auth-muted);
  }

  .auth .raw {
    margin: 0;
    padding: 0.75rem 0.85rem;
    overflow: auto;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: var(--auth-radius-md);
    background: #0f172a;
    color: #dbeafe;
    box-shadow: var(--auth-shadow-sm);
    font: 0.82rem/1.4 "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
      monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
`;

/**
 * Injects default auth styles once into document head.
 */
function ensureDefaultStyles() {
  if (typeof document === "undefined") {
    return;
  }
  if (document.head.querySelector(`style[${STYLES_ATTR}]`)) {
    return;
  }
  const style = document.createElement("style");
  style.setAttribute(STYLES_ATTR, "");
  style.textContent = DEFAULT_STYLES;
  document.head.append(style);
}

type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationId?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
};

type AuthConfig = {
  origin: string;
};

type ViewKind = "loading" | "signed-out" | "signed-in" | "error";

/**
 * Reads the first non-empty attribute value from the given names.
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
 * Reads Pro API origin from a pre.auth (or host) element.
 */
function readConfig(el: HTMLElement): AuthConfig {
  const raw = readAttr(el, ["data-origin", "origin"]);
  const origin = (raw ?? DEFAULT_ORIGIN).replace(/\/$/, "");
  return { origin };
}

/**
 * Builds an absolute API URL under the configured Pro origin.
 */
function apiUrl(origin: string, path: string) {
  if (!origin) {
    return path;
  }
  return new URL(path, `${origin}/`).toString();
}

/**
 * Builds a host div that replaces the source pre.
 */
function createHost() {
  const host = document.createElement("div");
  host.className = "auth";
  host.setAttribute(MOUNTED_ATTR, "");
  return host;
}

/**
 * Formats a display name from the auth user payload.
 */
function displayName(user: AuthUser) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return user.email || user.id;
}

/**
 * Role labels from the auth user payload.
 */
function userRoles(user: AuthUser) {
  if (user.roles?.length) {
    return user.roles;
  }
  return user.role ? [user.role] : [];
}

/**
 * Builds the Pro login URL that returns to the current book page after auth.
 */
function loginUrl(origin: string) {
  const url = new URL("/login", `${origin || window.location.origin}/`);
  url.searchParams.set("next", window.location.href);
  return url.toString();
}

/**
 * Builds the reactive Pro auth panel (light DOM; host CSS styles classes).
 * Sign-in navigates to Pro `/login`; session is checked via credentialed `/api/auth/me`.
 */
function AuthPanel(origin: string) {
  const view = van.state<ViewKind>("loading");
  const statusText = van.state("Checking…");
  const user = van.state<AuthUser | null>(null);
  const rawJson = van.state<string | null>(null);

  const setStatus = (
    next:
      | { kind: "loading" }
      | { kind: "signed-out" }
      | { kind: "signed-in"; user: AuthUser }
      | { kind: "error"; message: string },
    raw?: unknown,
  ) => {
    view.val = next.kind;
    if (next.kind === "loading") {
      statusText.val = "Checking…";
      user.val = null;
    } else if (next.kind === "signed-out") {
      statusText.val = "Signed out";
      user.val = null;
    } else if (next.kind === "signed-in") {
      statusText.val = `Signed in as ${displayName(next.user)}`;
      user.val = next.user;
    } else {
      statusText.val = next.message;
      user.val = null;
    }

    rawJson.val = raw === undefined ? null : JSON.stringify(raw, null, 2);
  };

  const refreshStatus = async () => {
    setStatus({ kind: "loading" });
    const url = apiUrl(origin, "/api/auth/me");

    try {
      const response = await fetch(url, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(
          {
            kind: "error",
            message: `auth/me failed: HTTP ${response.status}`,
          },
          payload,
        );
        return;
      }

      const me = payload?.user as AuthUser | null | undefined;
      if (!me) {
        setStatus({ kind: "signed-out" }, payload);
        return;
      }

      setStatus({ kind: "signed-in", user: me }, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({
        kind: "error",
        message: `Could not reach Pro auth (${message}). Is the Pro server running at this origin? Books must be on *.availabooks.com (or localhost) so the session cookie is sent.`,
      });
    }
  };

  const testProtected = async () => {
    const url = apiUrl(origin, "/api/auth/protected");
    try {
      const response = await fetch(url, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      rawJson.val = JSON.stringify(
        { status: response.status, body: payload },
        null,
        2,
      );
      if (!response.ok) {
        view.val = "error";
        statusText.val = `Protected route: HTTP ${response.status}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      rawJson.val = message;
      view.val = "error";
      statusText.val = "Protected route request failed";
    }
  };

  const originLabel = origin || "(same origin)";

  const goToLogin = () => {
    window.location.assign(loginUrl(origin));
  };

  const onSignOut = async () => {
    try {
      await fetch(apiUrl(origin, "/api/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      // Still clear local UI state.
    }
    await refreshStatus();
  };

  void refreshStatus();

  return div(
    { class: "panel" },
    p(
      {
        class: () => (view.val === "error" ? "status is-error" : "status"),
        hidden: () => view.val === "signed-in" || view.val === "signed-out",
      },
      statusText,
    ),
    div(
      {
        class: "profile",
        hidden: () => view.val !== "signed-in" || user.val == null,
      },
      div(
        { class: "profile-header" },
        h2({ class: "heading" }, "Profile"),
        p({ class: "lead" }, "You are signed in to Pro."),
      ),
      div(
        { class: "profile-identity" },
        div({ class: "avatar", "aria-hidden": "true" }, () => {
          const name = user.val ? displayName(user.val) : "?";
          return name.slice(0, 1).toUpperCase();
        }),
        div(
          p({ class: "profile-name" }, () =>
            user.val ? displayName(user.val) : "",
          ),
          p({ class: "profile-email" }, () => user.val?.email || ""),
        ),
      ),
      dl(
        { class: "details" },
        div(dt("User ID"), dd(() => user.val?.id || "—")),
        div(dt("Organization"), dd(() => user.val?.organizationId || "—")),
        div(
          dt("Role"),
          dd(() => {
            const current = user.val;
            if (!current) {
              return "—";
            }
            const roles = userRoles(current);
            if (!roles.length) {
              return "—";
            }
            return span(
              { class: "chip-row" },
              ...roles.map((role) => span({ class: "chip" }, role)),
            );
          }),
        ),
        div(
          dt("Permissions"),
          dd(() => {
            const permissions = user.val?.permissions ?? [];
            if (!permissions.length) {
              return "—";
            }
            return span(
              { class: "chip-row" },
              ...permissions.map((permission) =>
                span({ class: "chip" }, permission),
              ),
            );
          }),
        ),
      ),
      div(
        { class: "actions" },
        button(
          {
            type: "button",
            class: "btn btn-secondary",
            onclick: () => void onSignOut(),
          },
          "Sign out",
        ),
      ),
    ),
    div(
      {
        class: "login",
        hidden: () => view.val === "signed-in" || view.val === "loading",
      },
      div(
        { class: "login-header" },
        h2({ class: "heading" }, "Sign in"),
        p(
          { class: "lead" },
          "Continue to Pro to sign in with a one-time email code. You will return here afterward.",
        ),
      ),
      div(
        { class: "actions" },
        button(
          {
            type: "button",
            class: "btn btn-primary",
            onclick: goToLogin,
          },
          "Sign in with Pro",
        ),
      ),
    ),
    div(
      { class: "tools" },
      button(
        {
          type: "button",
          class: "btn btn-secondary",
          onclick: () => void refreshStatus(),
        },
        "Refresh",
      ),
      button(
        {
          type: "button",
          class: "btn btn-secondary",
          onclick: () => void testProtected(),
        },
        "Test protected",
      ),
      span(
        {
          class: "origin-hint",
          title: originLabel,
        },
        () => `Origin: ${originLabel}`,
      ),
    ),
    pre(
      {
        class: "raw",
        hidden: () => rawJson.val == null,
      },
      () => rawJson.val ?? "",
    ),
  );
}

/**
 * Replaces a pre.auth with a mounted Pro auth test panel.
 */
export function mountAuth(pre: HTMLElement) {
  if (!(pre instanceof HTMLElement) || pre.getAttribute(MOUNTED_ATTR) != null) {
    return null;
  }

  ensureDefaultStyles();

  const config = readConfig(pre);
  const host = createHost();
  if (config.origin) {
    host.setAttribute("data-origin", config.origin);
  }
  pre.replaceWith(host);

  van.add(host, AuthPanel(config.origin));
  return host;
}

/**
 * Finds and mounts every unmounted pre.auth under root (defaults to document).
 */
export function scanAndMountAuths(root?: ParentNode | null) {
  const scope = root || document;
  if (!scope || !("querySelectorAll" in scope)) {
    return [];
  }
  const nodes = scope.querySelectorAll("pre.auth");
  const mounted: HTMLElement[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const host = mountAuth(node);
    if (host) {
      mounted.push(host);
    }
  }
  return mounted;
}

if (typeof document !== "undefined") {
  scanAndMountAuths();
}
