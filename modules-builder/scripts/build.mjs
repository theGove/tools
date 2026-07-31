import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modulesDir = resolve(root, "src/modules");
const outDir = resolve(root, "../api");

/**
 * Turns a folder name into a valid IIFE global identifier.
 * @param {string} name - Module folder name.
 */
function toGlobalName(name) {
  const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[a-zA-Z_$]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

/**
 * Builds the source-path comment prepended to each output file.
 * @param {string} name - Module folder name.
 */
function buildBanner(name) {
  return [
    `/*`,
    ` * Generated file — do not edit directly.`,
    ` * Source: tools/modules-builder/src/modules/${name}/`,
    ` * Rebuild: cd tools/modules-builder && npm run build -- ${name}`,
    ` */`,
    ``,
  ].join("\n");
}

/**
 * Prepends the origin banner to a built file (ensures it is the first lines).
 * @param {string} name - Module folder name.
 */
function prependBanner(name) {
  const outFile = resolve(outDir, `${name}.js`);
  const banner = buildBanner(name);
  const code = readFileSync(outFile, "utf8");
  if (code.startsWith(banner)) {
    return;
  }
  writeFileSync(outFile, banner + code);
}

/**
 * Vite plugin that writes the origin banner after each (re)build.
 * @param {string} name - Module folder name.
 */
function bannerPlugin(name) {
  return {
    name: "availabooks-banner",
    closeBundle() {
      prependBanner(name);
    },
  };
}

/**
 * Builds one module folder into a single IIFE file in tools/api.
 * @param {string} name - Module folder name (also the output basename).
 * @param {{ watch?: boolean }} [options] - Build options.
 */
async function buildModule(name, options = {}) {
  const entry = resolve(modulesDir, name, "index.ts");
  if (!existsSync(entry)) {
    throw new Error(`No entry at src/modules/${name}/index.ts`);
  }

  const watching = Boolean(options.watch);
  console.log(
    watching
      ? `Watching ${name} → ../api/${name}.js`
      : `Building ${name} → ../api/${name}.js`,
  );

  const result = await build({
    configFile: false,
    root,
    logLevel: "warn",
    plugins: [bannerPlugin(name)],
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry,
        name: toGlobalName(name),
        formats: ["iife"],
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          extend: true,
        },
      },
      ...(watching ? { watch: {} } : {}),
    },
  });

  if (watching) {
    const watcher = /** @type {import("rollup").RollupWatcher} */ (result);
    watcher.on("event", (event) => {
      if (event.code === "END") {
        console.log(`Rebuilt ${name} → ../api/${name}.js`);
      } else if (event.code === "ERROR") {
        console.error(`Build error in ${name}:`, event.error);
      }
    });
  }
}

const args = process.argv.slice(2).filter((arg) => arg.length > 0);
const watch = args.includes("--watch");
const names = args.filter((arg) => arg !== "--watch");

if (names.length === 0) {
  console.error("Usage: npm run build -- <module> [module...]");
  console.error("       npm run build:watch -- <module> [module...]");
  console.error("Example: npm run build:watch -- a-quiz");
  process.exit(1);
}

for (const name of names) {
  await buildModule(name, { watch });
}

if (watch) {
  console.log(`Watching ${names.length} module(s): ${names.join(", ")} (Ctrl+C to stop)`);
} else {
  console.log(`Built ${names.length} module(s): ${names.join(", ")}`);
}
