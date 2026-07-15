import json
import os
import shutil
import subprocess
import sys

from utils import chapter_base_name
from utils import getJsonFile
from utils import getTitle
from utils import is_numeric_chapter_base
from utils import list_numeric_chapter_bases
from utils import local_chapter_html


def chapters_from_arguments(arguments):
    """
    Collect requested chapter ids or all numeric chapters when none are supplied.
    @param {list<string>} arguments - Command-line arguments after the script name.
    """
    if not arguments:
        return list_numeric_chapter_bases()

    chapters = []
    for argument in arguments:
        chapter_id = chapter_base_name(argument)
        if not is_numeric_chapter_base(chapter_id):
            print(f"Skipping {argument}: not a numeric chapter")
            continue
        if not os.path.isfile(f"{chapter_id}.md"):
            print(f"Skipping {argument}: {chapter_id}.md not found")
            continue
        chapters.append(chapter_id)
    return chapters


def load_pro_config():
    """Load and validate the Pro publishing settings from the current book."""
    config = getJsonFile("config.json")
    if config == "failed" or not isinstance(config, dict):
        raise ValueError("Could not load config.json")

    pro_config = config.get("pro")
    required_fields = ("contentDir", "slug", "title")
    if not isinstance(pro_config, dict) or any(
        not isinstance(pro_config.get(field), str) or not pro_config[field].strip()
        for field in required_fields
    ):
        raise ValueError(
            "config.json must define pro.contentDir, pro.slug, and pro.title"
        )

    return pro_config


def load_manifest(manifest_path, title):
    """
    Load an existing manifest or create the initial manifest structure.
    @param {string} manifest_path - Absolute path to manifest.json.
    @param {string} title - Configured book title.
    """
    if not os.path.isfile(manifest_path):
        return {"title": title, "chapters": []}

    with open(manifest_path, "r", encoding="utf-8") as manifest_file:
        manifest = json.load(manifest_file)

    if not isinstance(manifest, dict) or not isinstance(
        manifest.get("chapters"), list
    ):
        raise ValueError(f"Invalid Pro manifest: {manifest_path}")

    manifest["title"] = title
    return manifest


def write_manifest(manifest_path, manifest):
    """
    Write a deterministic, human-readable book manifest.
    @param {string} manifest_path - Destination manifest path.
    @param {dict} manifest - Book metadata and chapter summaries.
    """
    manifest["chapters"].sort(key=lambda chapter: int(chapter["id"]))
    with open(manifest_path, "w", encoding="utf-8") as manifest_file:
        json.dump(manifest, manifest_file, indent=2, ensure_ascii=False)
        manifest_file.write("\n")


def publish_chapter(book_directory, manifest, chapter_id):
    """
    Generate one chapter HTML fragment and update its manifest entry.
    @param {string} book_directory - Pro content directory for this book.
    @param {dict} manifest - Mutable book manifest.
    @param {string} chapter_id - Numeric chapter identifier.
    """
    html = local_chapter_html(chapter_id)
    title = getTitle(html, chapter_id)
    chapter_path = os.path.join(book_directory, f"{chapter_id}.html")

    with open(chapter_path, "w", encoding="utf-8") as chapter_file:
        chapter_file.write(html)

    chapter_summary = {"id": chapter_id, "title": title}
    chapters_by_id = {
        chapter["id"]: chapter
        for chapter in manifest["chapters"]
        if isinstance(chapter, dict) and "id" in chapter
    }
    chapters_by_id[chapter_id] = chapter_summary
    manifest["chapters"] = list(chapters_by_id.values())
    print(f"Published chapter {chapter_id}: {title}")


def build_pro_site(content_directory):
    """
    Run the Pro SSG build after content has been written.
    @param {string} content_directory - Absolute path to Pro's content directory.
    """
    project_directory = os.path.dirname(content_directory)
    if not os.path.isfile(os.path.join(project_directory, "package.json")):
        raise ValueError(
            f"Pro package.json not found beside content directory: {content_directory}"
        )

    npm_command = shutil.which("npm")
    if npm_command is None:
        raise RuntimeError("npm is required to build Availabooks Pro")

    print("Building Availabooks Pro...")
    subprocess.run(
        [npm_command, "run", "build"],
        cwd=project_directory,
        check=True,
    )


def main():
    """Publish requested local Markdown chapters to the Pro static site."""
    try:
        pro_config = load_pro_config()
        chapters = chapters_from_arguments(sys.argv[1:])
        if not chapters:
            print("No numeric chapters to publish.")
            return

        content_directory = os.path.abspath(pro_config["contentDir"])
        book_directory = os.path.join(content_directory, pro_config["slug"])
        os.makedirs(book_directory, exist_ok=True)

        manifest_path = os.path.join(book_directory, "manifest.json")
        manifest = load_manifest(manifest_path, pro_config["title"])
        for chapter_id in chapters:
            publish_chapter(book_directory, manifest, chapter_id)
        write_manifest(manifest_path, manifest)
        build_pro_site(content_directory)
        print(f"Pro site built with {len(chapters)} published chapter(s).")
    except (
        json.JSONDecodeError,
        OSError,
        RuntimeError,
        subprocess.CalledProcessError,
        ValueError,
    ) as error:
        print(f"Pro publish failed: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
