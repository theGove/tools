---
name: create-availabook
description: >-
  Create a new availabook Blogger blog by cloning the book1011 template
  (theme + posts with locked /2000/02/N.html paths). Use when starting a new
  availabook, cloning book1011, creating Book1XXX, or fixing chapter permalink
  paths like 2000/02/5.html.
---

# Create a new availabook

Read [notes.md](notes.md) first — those are the canonical manual rules.

## Why the two-step create matters

Blogger locks the permanent HTML filename from the **title on first publish**, and locks the `/YYYY/MM/` folder from the **published year/month on first publish**. Later title/date edits do **not** change the path.

Chapters must end up at:

```text
https://book1XXX.blogspot.com/2000/02/5.html
```

So for chapter `5`:

1. Create with title `5` and published year **2000**, month **Feb**
2. Then rename to `5. <chapter name>` and set the final published datetime

## What the API can and cannot do

| Step | Automatable? | Notes |
|------|--------------|-------|
| 1. Create blog `Book1XXX` | No | Blogger API has no `blogs.insert` |
| 2. Copy theme from book1011 | No | No theme API in Blogger v3 |
| 3. Copy posts (two-step path lock) | Yes | Needs OAuth write token |
| Validate paths | Yes | API key is enough |

`BLOGGER_API_KEY` in `tools/.env` is **read-only**. Creating/updating posts needs OAuth.

**Preferred:** Desktop OAuth client as `tools/credentials.json` (already gitignored):

```bash
cd tools
source .venv/bin/activate
pip install -r requirements.txt
python .cursor/skills/create-availabook/scripts/auth_login.py
```

That opens a browser once, then saves a refreshable `tools/token.json` (also gitignored). Later runs refresh automatically.

**Fallback:** set `BLOGGER_ACCESS_TOKEN` in `.env` from the [OAuth Playground](https://developers.google.com/oauthplayground/) (expires ~1 hour).

## Workflow

Copy this checklist:

```text
New availabook:
- [ ] 1. Create blog Book1XXX in Blogger UI
- [ ] 2. Copy theme from book1011 into the new blog (Blogger Theme editor)
- [ ] 3. Dry-run post clone plan
- [ ] 4. Clone posts with OAuth token
- [ ] 5. Validate permanent paths
- [ ] 6. Add local book folder + config.json with blogUrl
```

### 1–2. Manual (Blogger UI)

1. Create a new blog named `Book1XXX` (digits only in the XXX part).
2. Open **book1011** → Theme → backup/copy the theme into the new blog (same custom availabooks theme).

### 3. Inspect the template posts

From `tools/`:

```bash
source .venv/bin/activate
python .cursor/skills/create-availabook/scripts/list_source_posts.py
```

Path rules used when cloning (first-create year/month):

| Kind | First-create date | Example path |
|------|-------------------|--------------|
| chapter, toc, book, images | 2000-02 | `/2000/02/5.html` |
| data | 2000-01 | `/2000/01/sample.html` |
| module, css | 1970-01 | `/1970/01/monaco.html` |
| redirect | keep source date | path not fixed |

### 4. Clone posts

```bash
# Plan only
python .cursor/skills/create-availabook/scripts/clone_posts.py --target book1XXX.blogspot.com --dry-run

# Write (requires BLOGGER_ACCESS_TOKEN)
python .cursor/skills/create-availabook/scripts/clone_posts.py --target book1XXX.blogspot.com
```

Optional: `--only 1 2 toc book` to clone a subset.

Each post is inserted with the slug title + path-locking date, then updated to the final title/date/content/labels from book1011.

### 5. Validate

```bash
python .cursor/skills/create-availabook/scripts/validate_paths.py --blog book1XXX.blogspot.com --against-source
```

Every chapter must report `OK ... -> /2000/02/N.html`.

Note: on book1011 itself, the `images` post is currently at `/2026/05/images.html` (created with the wrong first-publish date). A correct clone will place it at `/2000/02/images.html`.

### 6. Local book folder

Create a content folder (like `ppwjs/` or `availabooks-supplychain/`) with:

```json
{
  "blogUrl": "book1XXX.blogspot.com"
}
```

Then use the normal tools (`preview.py`, `publish.py`, `download.py`) from that folder.

## Script reference

All scripts live in `.cursor/skills/create-availabook/scripts/`:

| Script | Needs | Purpose |
|--------|-------|---------|
| `auth_login.py` | `credentials.json` | One-time browser login → `token.json` |
| `list_source_posts.py` | API key | Show two-step recipe per source post |
| `clone_posts.py` | API key + OAuth | Clone posts onto the new blog |
| `validate_paths.py` | API key | Confirm permanent paths |

## Manual fallback (no OAuth)

If you cannot use an access token, follow [notes.md](notes.md) in the Blogger UI for each post. Use `list_source_posts.py` as the checklist of titles, dates, and expected paths.
