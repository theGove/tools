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
 * Builds one module folder into a single IIFE file in tools/api.
 * @param {string} name - Module folder name (also the output basename).
 */
async function buildModule(name) {
  const entry = resolve(modulesDir, name, "index.ts");
  if (!existsSync(entry)) {
    throw new Error(`No entry at src/modules/${name}/index.ts`);
  }

  console.log(`Building ${name} → ../api/${name}.js`);

  await build({
    configFile: false,
    root,
    logLevel: "warn",
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
    },
  });

  prependBanner(name);
}

const names = process.argv.slice(2).filter((arg) => arg.length > 0);
if (names.length === 0) {
  console.error("Usage: npm run build -- <module> [module...]");
  console.error("Example: npm run build -- a-quiz");
  process.exit(1);
}

for (const name of names) {
  await buildModule(name);
}

console.log(`Built ${names.length} module(s): ${names.join(", ")}`);
