"""Shared Blogger API helpers for create-availabook scripts."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import requests

from blogger_env import get_api_key, get_access_token

API_BASE = "https://www.googleapis.com/blogger/v3"


def _params(extra: dict | None = None) -> dict:
    """
    Build query params including the API key.
    @param {dict|None} extra - Extra query parameters.
    """
    params = {"key": get_api_key()}
    if extra:
        params.update(extra)
    return params


def _headers(write: bool = False) -> dict[str, str]:
    """
    Build request headers; include OAuth bearer token when writing.
    @param {bool} write - If True, require and attach BLOGGER_ACCESS_TOKEN.
    """
    headers = {"Content-Type": "application/json"}
    if write:
        token = get_access_token()
        if not token:
            raise RuntimeError("BLOGGER_ACCESS_TOKEN required for write operations")
        headers["Authorization"] = f"Bearer {token}"
    return headers


def get_blog_by_url(url: str) -> dict:
    """
    Fetch blog metadata by public URL.
    @param {string} url - Blog homepage URL, e.g. https://book1011.blogspot.com/
    """
    response = requests.get(
        f"{API_BASE}/blogs/byurl",
        params=_params({"url": url}),
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def get_blog(blog_id: str) -> dict:
    """
    Fetch blog metadata by ID.
    @param {string} blog_id - Blogger blog ID.
    """
    response = requests.get(
        f"{API_BASE}/blogs/{blog_id}",
        params=_params(),
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def list_all_posts(blog_id: str, fetch_bodies: bool = True) -> list[dict]:
    """
    Return every post for a blog (paginated).
    @param {string} blog_id - Blogger blog ID.
    @param {bool} fetch_bodies - Include post HTML content.
    """
    items: list[dict] = []
    page_token: str | None = None
    while True:
        extra: dict[str, Any] = {
            "maxResults": 50,
            "fetchBodies": str(fetch_bodies).lower(),
        }
        if page_token:
            extra["pageToken"] = page_token
        response = requests.get(
            f"{API_BASE}/blogs/{blog_id}/posts",
            params=_params(extra),
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        items.extend(data.get("items", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return items


def parse_post_path(url: str) -> tuple[int, int, str] | None:
    """
    Parse /YYYY/MM/slug.html from a Blogger post URL.
    @param {string} url - Full post URL.
    """
    path = urlparse(url).path
    match = re.fullmatch(r"/(\d{4})/(\d{2})/([^/]+)\.html", path)
    if not match:
        return None
    return int(match.group(1)), int(match.group(2)), match.group(3)


def classify_post(post: dict) -> str:
    """
    Classify a template post for path-rule purposes.
    @param {dict} post - Blogger posts resource.
    """
    labels = set(post.get("labels") or [])
    title = (post.get("title") or "").strip()
    parsed = parse_post_path(post.get("url", ""))
    slug = parsed[2] if parsed else title

    if "chapter" in labels or re.fullmatch(r"\d+", slug or ""):
        return "chapter"
    if "toc" in labels or slug == "toc":
        return "toc"
    if slug == "book" or title == "book":
        return "book"
    if slug == "images" or title == "images":
        return "images"
    if "data" in labels:
        return "data"
    if "module" in labels or "css" in labels or slug == "css":
        return "module" if "module" in labels or slug != "css" else "css"
    if "redirect" in labels or title == "redirect":
        return "redirect"
    return "other"


def create_slug_title(post: dict) -> str:
    """
    Title to use on first create so Blogger locks the HTML filename.
    @param {dict} post - Source Blogger post.
    """
    kind = classify_post(post)
    parsed = parse_post_path(post.get("url", ""))
    if kind == "chapter":
        labels = post.get("labels") or []
        for label in labels:
            if re.fullmatch(r"\d+", label):
                return label
        if parsed and re.fullmatch(r"\d+", parsed[2]):
            return parsed[2]
    if parsed:
        # Prefer the permanent filename slug when the URL already looks correct.
        year, month, slug = parsed
        if kind in ("toc", "book", "images", "data", "module", "css") or (
            year in (1970, 2000) and not slug.startswith("redirect_")
        ):
            return slug
    title = (post.get("title") or "").strip()
    if kind == "redirect":
        return "redirect"
    return title


def create_published(post: dict) -> str:
    """
    RFC3339 published datetime for first create (locks year/month in the path).
    @param {dict} post - Source Blogger post.
    """
    kind = classify_post(post)
    source_published = post.get("published") or "2000-02-01T12:00:00-08:00"
    # Keep the source time-of-day; override year/month from path rules.
    try:
        dt = datetime.fromisoformat(source_published.replace("Z", "+00:00"))
    except ValueError:
        dt = datetime(2000, 2, 1, 12, 0, 0, tzinfo=timezone.utc)

    if kind == "redirect":
        # Redirect keeps a current-ish date; path is not /2000/02/.
        return source_published

    year_month = {
        "chapter": (2000, 2),
        "toc": (2000, 2),
        "book": (2000, 2),
        "images": (2000, 2),
        "data": (2000, 1),
        "module": (1970, 1),
        "css": (1970, 1),
        "other": (dt.year, dt.month),
    }.get(kind, (dt.year, dt.month))

    year, month = year_month
    fixed = dt.replace(year=year, month=month)
    return fixed.isoformat()


def expected_path(post: dict) -> str | None:
    """
    Expected permanent path after a correct two-step create.
    @param {dict} post - Source Blogger post.
    """
    kind = classify_post(post)
    slug = create_slug_title(post)
    if kind == "redirect":
        return None  # Blogger may append a suffix; do not hard-require path
    year, month = {
        "chapter": (2000, 2),
        "toc": (2000, 2),
        "book": (2000, 2),
        "images": (2000, 2),
        "data": (2000, 1),
        "module": (1970, 1),
        "css": (1970, 1),
    }.get(kind, (None, None))
    if year is None:
        parsed = parse_post_path(post.get("url", ""))
        if not parsed:
            return None
        year, month, slug = parsed
    return f"/{year:04d}/{month:02d}/{slug}.html"


def insert_post(blog_id: str, body: dict) -> dict:
    """
    Create a post on the target blog (requires OAuth).
    @param {string} blog_id - Target blog ID.
    @param {dict} body - Posts resource fields (title, content, published, labels).
    """
    response = requests.post(
        f"{API_BASE}/blogs/{blog_id}/posts",
        params=_params(),
        headers=_headers(write=True),
        json=body,
        timeout=120,
    )
    if not response.ok:
        raise RuntimeError(f"insert failed ({response.status_code}): {response.text}")
    return response.json()


def update_post(blog_id: str, post_id: str, body: dict) -> dict:
    """
    Update an existing post (requires OAuth).
    @param {string} blog_id - Target blog ID.
    @param {string} post_id - Post ID to update.
    @param {dict} body - Full posts resource for update.
    """
    response = requests.put(
        f"{API_BASE}/blogs/{blog_id}/posts/{post_id}",
        params=_params(),
        headers=_headers(write=True),
        json=body,
        timeout=120,
    )
    if not response.ok:
        raise RuntimeError(f"update failed ({response.status_code}): {response.text}")
    return response.json()
