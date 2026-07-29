# Availabooks

Tools and content for authoring and publishing interactive textbooks. Markdown chapters are converted to HTML and published to a blog via a Google Apps Script deployment.

## Getting started

### 1. Install system dependencies

- **Pandoc** — required for Markdown conversion. Install from [pandoc.org/installing.html](https://pandoc.org/installing.html).
- **Live Server** (optional) — VS Code extension for local HTML preview.

### 2. Install Python dependencies

From the `tools` directory, create a virtual environment and install packages (Homebrew Python 3.14+ blocks global `pip install`):

```bash
cd tools
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

This installs `pypandoc`, `PyYAML`, `beautifulsoup4`, and `requests`. Keep the venv activated while running scripts, or call `../tools/.venv/bin/python` explicitly from a book folder.

### 3. Add your deployment ID

Create a file named `deploymentId.txt` in the `tools` directory:

```bash
touch tools/deploymentId.txt
```

Ask a member of the project for the Google Apps Script deployment ID and paste it into that file (one line, no extra whitespace). The publish scripts read this file to call the deployment endpoint.

`deploymentId.txt` is listed in `.gitignore` and should not be committed.

## Project layout


| Path                       | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `tools/`                   | Python scripts for preview, publish, and download |
| `api/`                     | Client JS loaded into chapters via `_$_import`    |
| `ppwjs/`                   | Example book content                              |
| `availabooks-supplychain/` | Supply chain book content                         |


Each book directory contains Markdown chapters (`1.md`, `2.md`, …), a `config.json`, and a `local/` folder with HTML templates for preview.

## API client code (`api/`)

The `api/` directory holds client-side JavaScript that loads when a blog post or book chapter is opened (for example `monaco.js`, `andy.js`, `system.js`). Chapters pull this code in with:

```md
_$_import: monaco
```

Use the filename in `api/` without the `.js` extension. Multiple modules can be listed, separated by commas (e.g. `_$_import: monaco, appsscript`).

### Register a new API module on Blogger

Api modules are published to the shared `availabooks-system.blogspot.com` blog, not the book’s own blog. Before a file in `api/` can be used, it must exist as a post on that blog:

1. Create a new post whose **title** is the filename without the extension (e.g. `monaco` for `monaco.js`).
2. Label that post with two labels: the same name (again without the extension) and the version to publish it to (e.g. `dev`).
3. Set the post’s create date to **January 1, 1970** (the earliest date Blogger allows).

Save the post. Then publish the local file into that post with `publish-api.py` (run from the book folder, same as the other tools), passing the version first:

```bash
cd ppwjs
python ../tools/publish-api.py dev monaco
```

You can list several APIs in one run:

```bash
python ../tools/publish-api.py dev system monaco
```

The script finds the post labeled with both the api name and the version via the blog feed and uploads the contents of `api/<name>.js` into it. If no post matches both labels, it exits with an error instead of publishing. After it succeeds, chapters can use `_$_import: <name>`.

## GUI

A desktop window for download/preview/publish/publish-api, for anyone who'd rather not use the command line:

```bash
python tools/gui.py
```

It auto-discovers book folders (any sibling of `tools/` with a `config.json`), lists that book's numbered chapters for you to check off, and streams each script's output live. Some actions (bulk publish, creating a new API post) ask for confirmation — type your answer into the reply box under the log and press Enter, the same as you would in a terminal. Publishing actions post live to the blog, same as running the scripts directly.

Requires `tkinter`, which ships with the standard python.org and Homebrew installers; on some Linux distros install it separately (e.g. `apt install python3-tk`).

## Using the tools

**Run scripts from the book folder you are working in, not from `tools/`.** Each script reads that folder's Markdown files, `config.json`, and `local/` templates. Change into the book directory first, then invoke the script with `../tools/`.

For example, to publish from `ppwjs`:

```bash
cd ppwjs
python ../tools/publish.py 1 2 3
```

The same applies to `preview.py` and `download.py` — always `cd` into the book folder (e.g. `ppwjs/` or `availabooks-supplychain/`) before running.

**Preview a chapter locally** — converts Markdown to HTML and updates the matching file in `local/`:

```bash
cd ppwjs
python ../tools/preview.py 1
```

**Publish chapters to the blog**:

```bash
cd ppwjs
python ../tools/publish.py 1 2 3
```

With no arguments, `publish.py` pulls the Blogger `chapter` feed, compares each local `N.md` to the published HTML (normalizing line endings and entities), and publishes only chapters whose content changed.

When you pass chapter numbers, the same comparison runs first: unchanged chapters are skipped even if you listed them.

List chapter numbers in order so chapter numbering stays correct on the blog.

**Publish chapters to Availabooks Pro**:

Add a `pro` block to the book's `config.json`:

```json
{
  "blogUrl": "book1007.blogspot.com",
  "pro": {
    "contentDir": "../pro/content",
    "slug": "ppwjs",
    "title": "Personal Productivity with JavaScript"
  }
}
```

Then run the Pro publisher from the book folder:

```bash
cd ppwjs
python ../tools/publish_pro.py 1 2 3
```

With no chapter arguments, `publish_pro.py` publishes every numeric Markdown chapter. It writes Pandoc-generated HTML fragments and a manifest into `pro/content/{slug}/`, copies any modules requested by `_$_import` (such as `monaco`) from `api/` into Pro's static assets, then runs the Hono SSG build in `pro/`. This does not publish or change Blogger content. Deploy the generated site separately with `cd ../pro && npm run deploy`.

For Blogger, API modules still go through the one-time Blogger post setup and `publish-api.py` described under [API client code](#api-client-code-api).

**Download from the blog** — pulls down the current live content to use as your local working copy:

```bash
cd ppwjs
python ../tools/download.py
```

This script:

- Downloads the table of contents page and every chapter page linked from it into `local/`
- Downloads any Blogger posts tagged with the `data` label and saves each one as a JSON file in `local/feeds/`



To build the TOC:  open 

https://book1014.blogspot.com/1970/01/table-of-contents.html?deploymentId=<deploymentId from deploymentId.txt>  
This will scan the book for numbered chapters then updated the toc with the correct data