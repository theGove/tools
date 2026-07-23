#!/usr/bin/env python3
"""List book1011 template posts and the two-step create recipe for each."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from blogger_api import (
    classify_post,
    create_published,
    create_slug_title,
    expected_path,
    list_all_posts,
)
from blogger_env import SOURCE_BLOG_ID, SOURCE_BLOG_URL


def main() -> None:
    parser = argparse.ArgumentParser(
        description="List source availabook posts and create recipes."
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON instead of a table.",
    )
    parser.add_argument(
        "--blog-id",
        default=SOURCE_BLOG_ID,
        help=f"Source blog ID (default: book1011 {SOURCE_BLOG_ID}).",
    )
    args = parser.parse_args()

    posts = list_all_posts(args.blog_id, fetch_bodies=False)
    recipes = []
    for post in sorted(posts, key=lambda p: p.get("published", "")):
        kind = classify_post(post)
        recipe = {
            "kind": kind,
            "sourceTitle": post.get("title"),
            "sourceUrl": post.get("url"),
            "labels": post.get("labels") or [],
            "step1Title": create_slug_title(post),
            "step1Published": create_published(post),
            "step2Title": post.get("title"),
            "step2Published": post.get("published"),
            "expectedPath": expected_path(post),
        }
        recipes.append(recipe)

    if args.json:
        print(json.dumps({"source": SOURCE_BLOG_URL, "posts": recipes}, indent=2))
        return

    print(f"Source: {SOURCE_BLOG_URL} ({args.blog_id})")
    print(f"Posts: {len(recipes)}\n")
    for recipe in recipes:
        print(f"[{recipe['kind']}] {recipe['sourceTitle']!r}")
        print(f"  source:   {recipe['sourceUrl']}")
        print(f"  step 1:   title={recipe['step1Title']!r}  published={recipe['step1Published']}")
        print(f"  step 2:   title={recipe['step2Title']!r}  published={recipe['step2Published']}")
        print(f"  expect:   {recipe['expectedPath']}")
        print(f"  labels:   {recipe['labels']}")
        print()


if __name__ == "__main__":
    main()
