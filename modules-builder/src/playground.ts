const entryModules = import.meta.glob("./modules/*/index.ts");
const demoModules = import.meta.glob("./modules/*/demo.html", {
  query: "?raw",
  import: "default",
});

/**
 * Reads the module folder name from a glob path.
 * @param {string} path - Vite glob path like ./modules/hello/index.ts.
 */
function moduleNameFromPath(path: string) {
  const match = path.match(/^\.\/modules\/([^/]+)\//);
  return match?.[1] ?? null;
}

/**
 * Builds a sorted list of module folder names from discovered entries.
 */
function listModuleNames() {
  return Object.keys(entryModules)
    .map(moduleNameFromPath)
    .filter((name): name is string => Boolean(name))
    .sort();
}

/**
 * Finds the glob path for a module's entry file.
 * @param {string} name - Module folder name.
 */
function entryPathFor(name: string) {
  return `./modules/${name}/index.ts`;
}

/**
 * Finds the glob path for a module's optional demo markup.
 * @param {string} name - Module folder name.
 */
function demoPathFor(name: string) {
  return `./modules/${name}/demo.html`;
}

/**
 * Calls a module's scanAndMount* export if present (pre/code mounts need a re-scan after inject).
 * @param {Record<string, unknown>} mod - Loaded module.
 * @param {HTMLElement} preview - Element that hosts the demo markup.
 */
function scanMountedDemos(mod: Record<string, unknown>, preview: HTMLElement) {
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value !== "function" || !/^scanAndMount/i.test(key)) {
      continue;
    }
    value(preview);
    return;
  }
}

/**
 * Loads a module and renders its demo into the preview host.
 * @param {string} name - Module folder name.
 * @param {HTMLElement} preview - Element that hosts the demo markup.
 */
async function loadModule(name: string, preview: HTMLElement) {
  const entryPath = entryPathFor(name);
  const loadEntry = entryModules[entryPath];
  if (!loadEntry) {
    preview.textContent = `No entry found for "${name}".`;
    return;
  }

  preview.replaceChildren();
  preview.textContent = "Loading…";

  const mod = (await loadEntry()) as Record<string, unknown>;

  const loadDemo = demoModules[demoPathFor(name)];
  if (loadDemo) {
    const html = (await loadDemo()) as string;
    preview.innerHTML = html;
    scanMountedDemos(mod, preview);
    return;
  }

  preview.textContent =
    `Loaded "${name}". Add src/modules/${name}/demo.html for a preview.`;
}

/**
 * Wires the module dropdown and initial selection.
 */
async function main() {
  const select = document.querySelector<HTMLSelectElement>("#module-select");
  const preview = document.querySelector<HTMLElement>("#preview");
  if (!select || !preview) {
    throw new Error("Playground markup is missing #module-select or #preview.");
  }

  const names = listModuleNames();
  select.replaceChildren();

  if (names.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No modules in src/modules";
    select.append(option);
    select.disabled = true;
    preview.textContent = "Add a folder under src/modules with an index.ts.";
    return;
  }

  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.append(option);
  }

  /**
   * Handles dropdown changes by loading the chosen module.
   */
  const onChange = () => {
    void loadModule(select.value, preview);
  };

  select.addEventListener("change", onChange);

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("c");
  select.value = fromQuery && names.includes(fromQuery) ? fromQuery : names[0]!;
  onChange();
}

void main();
