#!/usr/bin/env python3
"""
Clone posts from book1011 onto a new availabook blog.

Uses the two-step create pattern so permanent paths stay correct
(e.g. /2000/02/5.html for chapters).

Requires BLOGGER_API_KEY (read) and BLOGGER_ACCESS_TOKEN (write) in tools/.env.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from blogger_api import (
    classify_post,
    create_published,
    create_slug_title,
    expected_path,
    get_blog_by_url,
    insert_post,
    list_all_posts,
    parse_post_path,
    update_post,
)
from blogger_env import SOURCE_BLOG_ID, SOURCE_BLOG_URL, require_access_token


def normalize_blog_url(url: str) -> str:
    """
    Normalize a blog URL for the byurl API.
    @param {string} url - Blog URL or hostname.
    """
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    if not url.endswith("/"):
        url += "/"
    return url


def already_cloned(target_posts: list[dict], expected: str | None, final_title: str) -> dict | None:
    """
    Find an existing target post that matches the expected path or final title.
    @param {list} target_posts - Posts already on the target blog.
    @param {string|None} expected - Expected path like /2000/02/5.html.
    @param {string} final_title - Final post title from the source.
    """
    for post in target_posts:
        if expected:
            parsed = parse_post_path(post.get("url", ""))
            if parsed:
                path = f"/{parsed[0]:04d}/{parsed[1]:02d}/{parsed[2]}.html"
                if path == expected:
                    return post
        if (post.get("title") or "").strip() == (final_title or "").strip():
            return post
    return None


def clone_one(source: dict, target_blog_id: str, dry_run: bool) -> dict:
    """
    Create one post with the two-step title/date pattern, then restore finals.
    @param {dict} source - Source post resource (with content).
    @param {string} target_blog_id - Destination blog ID.
    @param {bool} dry_run - If True, only print the plan.
    """
    kind = classify_post(source)
    step1_title = create_slug_title(source)
    step1_published = create_published(source)
    step2_title = source.get("title")
    step2_published = source.get("published")
    expected = expected_path(source)
    labels = source.get("labels") or []

    plan = {
        "kind": kind,
        "step1Title": step1_title,
        "step1Published": step1_published,
        "step2Title": step2_title,
        "step2Published": step2_published,
        "expectedPath": expected,
        "labels": labels,
    }

    if dry_run:
        print(f"DRY-RUN [{kind}] create {step1_title!r} @ {step1_published}")
        print(f"         then update to {step2_title!r} @ {step2_published}")
        print(f"         expect path {expected}")
        return plan

    created = insert_post(
        target_blog_id,
        {
            "kind": "blogger#post",
            "title": step1_title,
            "content": source.get("content") or "",
            "published": step1_published,
            "labels": labels,
        },
    )
    created_path = parse_post_path(created.get("url", ""))
    print(f"  created: {created.get('url')}")

    if expected and created_path:
        actual = f"/{created_path[0]:04d}/{created_path[1]:02d}/{created_path[2]}.html"
        if actual != expected:
            print(f"  WARNING: path {actual} != expected {expected}")

    # Step 2: restore display title and published datetime from source.
    needs_update = (
        created.get("title") != step2_title
        or created.get("published") != step2_published
    )
    if needs_update:
        updated = update_post(
            target_blog_id,
            created["id"],
            {
                "id": created["id"],
                "title": step2_title,
                "content": source.get("content") or "",
                "published": step2_published,
                "labels": labels,
            },
        )
        print(f"  updated: title={updated.get('title')!r} url={updated.get('url')}")
        plan["targetUrl"] = updated.get("url")
        plan["targetId"] = updated.get("id")
    else:
        plan["targetUrl"] = created.get("url")
        plan["targetId"] = created.get("id")

    return plan


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clone book1011 posts onto a new availabook blog."
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Target blog URL or host, e.g. book1099.blogspot.com",
    )
    parser.add_argument(
        "--source-blog-id",
        default=SOURCE_BLOG_ID,
        help=f"Source blog ID (default book1011: {SOURCE_BLOG_ID})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the create plan without writing.",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Optional chapter numbers / slugs to clone (default: all).",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.5,
        help="Seconds to sleep between writes (default 0.5).",
    )
    args = parser.parse_args()

    if not args.dry_run:
        require_access_token()

    target_url = normalize_blog_url(args.target)
    target_blog = get_blog_by_url(target_url)
    target_blog_id = target_blog["id"]
    print(f"Source: {SOURCE_BLOG_URL} ({args.source_blog_id})")
    print(f"Target: {target_blog.get('url')} ({target_blog_id}) name={target_blog.get('name')!r}")

    source_posts = list_all_posts(args.source_blog_id, fetch_bodies=True)
    target_posts = list_all_posts(target_blog_id, fetch_bodies=False)

    only = set(args.only or [])
    cloned = 0
    skipped = 0
    for source in sorted(source_posts, key=lambda p: p.get("published", "")):
        slug = create_slug_title(source)
        if only and slug not in only and (source.get("title") or "") not in only:
            continue

        expected = expected_path(source)
        existing = already_cloned(target_posts, expected, source.get("title") or "")
        if existing:
            print(f"SKIP [{classify_post(source)}] already present: {existing.get('url')}")
            skipped += 1
            continue

        print(f"CLONE [{classify_post(source)}] {source.get('title')!r}")
        clone_one(source, target_blog_id, dry_run=args.dry_run)
        cloned += 1
        if not args.dry_run and args.sleep:
            time.sleep(args.sleep)

    print(f"\nDone. cloned={cloned} skipped={skipped} dry_run={args.dry_run}")


if __name__ == "__main__":
    main()
