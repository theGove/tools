#!/usr/bin/env python3
"""Validate that a blog's posts have the permanent paths availabooks expects."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from blogger_api import (
    classify_post,
    create_slug_title,
    expected_path,
    get_blog_by_url,
    list_all_posts,
    parse_post_path,
)
from blogger_env import SOURCE_BLOG_ID


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


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate availabook permanent post paths on a blog."
    )
    parser.add_argument(
        "--blog",
        required=True,
        help="Blog URL or host to validate, e.g. book1099.blogspot.com",
    )
    parser.add_argument(
        "--against-source",
        action="store_true",
        help="Also check that every book1011 expected path exists on the target.",
    )
    args = parser.parse_args()

    blog = get_blog_by_url(normalize_blog_url(args.blog))
    posts = list_all_posts(blog["id"], fetch_bodies=False)
    print(f"Blog: {blog.get('url')} ({blog['id']}) posts={len(posts)}\n")

    failures = 0
    for post in sorted(posts, key=lambda p: p.get("published", "")):
        kind = classify_post(post)
        expected = expected_path(post)
        parsed = parse_post_path(post.get("url", ""))
        actual = (
            f"/{parsed[0]:04d}/{parsed[1]:02d}/{parsed[2]}.html" if parsed else None
        )

        if expected is None:
            print(f"OK   [{kind}] {post.get('title')!r} path={actual} (no fixed path rule)")
            continue

        if actual == expected:
            print(f"OK   [{kind}] {post.get('title')!r} -> {actual}")
        else:
            failures += 1
            print(
                f"FAIL [{kind}] {post.get('title')!r}\n"
                f"       actual={actual} expected={expected}\n"
                f"       url={post.get('url')}"
            )

    if args.against_source:
        print("\nComparing against book1011 expected paths...")
        source_posts = list_all_posts(SOURCE_BLOG_ID, fetch_bodies=False)
        target_paths = set()
        for post in posts:
            parsed = parse_post_path(post.get("url", ""))
            if parsed:
                target_paths.add(
                    f"/{parsed[0]:04d}/{parsed[1]:02d}/{parsed[2]}.html"
                )

        for source in source_posts:
            expected = expected_path(source)
            if expected is None:
                continue
            if expected in target_paths:
                print(f"OK   source {create_slug_title(source)!r} -> {expected}")
            else:
                failures += 1
                print(f"MISS source {create_slug_title(source)!r} missing {expected}")

    if failures:
        print(f"\n{failures} problem(s) found.")
        sys.exit(1)
    print("\nAll checked paths look good.")


if __name__ == "__main__":
    main()
