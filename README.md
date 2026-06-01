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

List chapter numbers in order so chapter numbering stays correct on the blog.

**Download from the blog** — pulls down the current live content to use as your local working copy:

```bash
cd ppwjs
python ../tools/download.py
```

This script:

- Downloads the table of contents page and every chapter page linked from it into `local/`
- Downloads any Blogger posts tagged with the `data` label and saves each one as a JSON file in `local/feeds/`

