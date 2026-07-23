const MOUNTED_ATTR = "data-abby-mounted";

/** Default Abby app origin for published books. Override with data-origin. */
const DEFAULT_ORIGIN = "https://abilityby.ai";

const IFRAME_STYLE = "width:100%;height:500px;border:0;display:block;";
const IFRAME_ALLOW = "microphone";

type AbbyConfig = {
  book: string;
  section: string | null;
  embed: boolean;
  origin: string;
};

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
 * Parses embed mode; defaults to true unless explicitly false/0/no/off.
 */
function parseEmbed(raw: string | null) {
  if (raw == null) {
    return true;
  }
  const value = raw.trim().toLowerCase();
  if (value === "" || value === "true" || value === "1" || value === "yes") {
    return true;
  }
  if (value === "false" || value === "0" || value === "no" || value === "off") {
    return false;
  }
  return true;
}

/**
 * Reads book / section / embed / origin from a pre.abby (or host) element.
 */
function readConfig(el: HTMLElement): AbbyConfig | { error: string } {
  const book = readAttr(el, ["data-book", "book"]);
  if (!book) {
    return { error: 'abby requires a book attribute, e.g. book="hs-government-demo".' };
  }

  const section = readAttr(el, ["data-section", "section"]);
  const origin = (readAttr(el, ["data-origin", "origin"]) || DEFAULT_ORIGIN).replace(
    /\/$/,
    "",
  );
  const embed = parseEmbed(readAttr(el, ["data-embed", "embed"]));

  return { book, section, embed, origin };
}

/**
 * Builds the Abby book (or section) URL for the iframe src.
 */
function buildSrc(config: AbbyConfig) {
  const path = config.section
    ? `/book/${encodeURIComponent(config.book)}/${encodeURIComponent(config.section)}`
    : `/book/${encodeURIComponent(config.book)}`;
  const url = new URL(path, `${config.origin}/`);
  if (config.embed) {
    url.searchParams.set("embed", "1");
  }
  return url.toString();
}

/**
 * Creates the preset Abby drop-in iframe.
 */
function createIframe(config: AbbyConfig) {
  const iframe = document.createElement("iframe");
  iframe.src = buildSrc(config);
  iframe.setAttribute("style", IFRAME_STYLE);
  iframe.setAttribute("allow", IFRAME_ALLOW);
  iframe.title = config.section
    ? `Abby: ${config.book} / ${config.section}`
    : `Abby: ${config.book}`;
  return iframe;
}

/**
 * Builds a host div that replaces the source pre.
 */
function createHost() {
  const host = document.createElement("div");
  host.className = "abby";
  host.setAttribute(MOUNTED_ATTR, "");
  return host;
}

/**
 * Replaces a pre.abby with a mounted Abby iframe host.
 */
export function mountAbby(pre: HTMLElement) {
  if (!(pre instanceof HTMLElement) || pre.getAttribute(MOUNTED_ATTR) != null) {
    return null;
  }

  const config = readConfig(pre);
  const host = createHost();
  pre.replaceWith(host);

  if ("error" in config) {
    const errorEl = document.createElement("p");
    errorEl.className = "abby-error";
    errorEl.textContent = `abby error: ${config.error}`;
    host.append(errorEl);
    return host;
  }

  host.append(createIframe(config));
  return host;
}

/**
 * Finds and mounts every unmounted pre.abby under root (defaults to document).
 */
export function scanAndMountAbbys(root?: ParentNode | null) {
  const scope = root || document;
  if (!scope || !("querySelectorAll" in scope)) {
    return [];
  }
  const nodes = scope.querySelectorAll("pre.abby");
  const mounted: HTMLElement[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const host = mountAbby(node);
    if (host) {
      mounted.push(host);
    }
  }
  return mounted;
}

if (typeof document !== "undefined") {
  scanAndMountAbbys();
}
