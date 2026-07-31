# Modules builder

TypeScript sources for interactive book modules. Each module under `src/modules/` builds to a single IIFE file in `../api/` (e.g. `a-quiz` → `tools/api/a-quiz.js`), which local textbook checkouts load via `_$_import`.

## Develop a module (recommended)

The best way to develop is with watch mode so edits rebuild into `tools/api/` automatically:

```bash
cd tools/modules-builder
npm install   # first time only
npm run build:watch  a-quiz # or whatever module you want to build
```

Then:

1. Serve a book locally at `local.availabooks.com` (Live Server).
2. Open a chapter that imports the module (`_$_import: a-quiz`).
3. Edit TypeScript under `src/modules/a-quiz/`.
4. Refresh the chapter after each rebuild.

Watch multiple modules:

```bash
npm run build:watch -- a-quiz auth abby
```

One-shot build (no watch):

```bash
npm run build -- a-quiz
```

Generated `tools/api/*.js` files are not edited by hand — change the TypeScript and rebuild.

## Other scripts

| Script | Purpose |
| --- | --- |
| `npm run build:watch -- <module>` | Rebuild into `tools/api/` on change (preferred for book testing) |
| `npm run build -- <module>` | One-shot build into `tools/api/` |
| `npm run dev` | Vite playground for isolated demos (`demo.html` per module) |
| `npm run typecheck` | TypeScript check without emitting |

## Module layout

```
src/modules/<name>/
  index.ts      # entry (required)
  demo.html     # optional markup for `npm run dev`
  *.ts          # other source files
```

Folder name is the output basename and the `_$_import` name.
