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
| `ppwjs/`                   | Example book content                              |
| `availabooks-supplychain/` | Supply chain book content                         |


Each book directory contains Markdown chapters (`1.md`, `2.md`, …), a `config.json`, and a `local/` folder with HTML templates for preview.

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

With no chapter arguments, `publish_pro.py` publishes every numeric Markdown chapter. It writes Pandoc-generated HTML fragments and a manifest into `pro/content/{slug}/`, copies any modules requested by `_$_import` (such as `monaco`) from `tools/api/` into Pro's static assets, then runs the Hono SSG build in `pro/`. This does not publish or change Blogger content. Deploy the generated site separately with `cd ../pro && npm run deploy`.

**Download from the blog** — pulls down the current live content to use as your local working copy:

```bash
cd ppwjs
python ../tools/download.py
```

This script:

- Downloads the table of contents page and every chapter page linked from it into `local/`
- Downloads any Blogger posts tagged with the `data` label and saves each one as a JSON file in `local/feeds/`

