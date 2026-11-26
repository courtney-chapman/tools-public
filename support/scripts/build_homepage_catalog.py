"""Build the website catalog and README rows from one catalog source."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = "https://courtney-chapman.github.io/tools-public/"
REPO = "https://github.com/courtney-chapman/tools-public"


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()[:12]


def versioned_homepage(source: str, assets: dict[str, bytes]) -> str:
    for name, content in assets.items():
        pattern = rf'((?:src|href)="{re.escape(name)}\?v=)[^"]+'
        source, count = re.subn(pattern, lambda match: match.group(1) + digest(content), source)
        assert count == 1, f"Expected one versioned {name} reference in index.html"
    return source


def validate(data: dict) -> None:
    formats = {entry["id"]: entry for entry in data["formats"]}
    assert len(formats) == len(data["formats"]), "Duplicate format"
    assert len(data["topics"]) == len(set(data["topics"])), "Duplicate topic"
    for format_ in data["formats"]:
        assert all(format_.get(key) for key in ("label", "singular", "instruction", "primary_label")), format_["id"]
        if guide_id := format_.get("guide_template_id"):
            assert re.fullmatch(r"[a-z0-9-]+", guide_id), format_["id"]
            assert (ROOT / "index.html").read_text().count(f'<template id="{guide_id}"') == 1, format_["id"]
    codex = json.loads((ROOT / ".agents/plugins/marketplace.json").read_text())
    claude = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
    marketplace_names = {
        "codex": {entry["name"] for entry in codex["plugins"]},
        "claude-code": {entry["name"] for entry in claude["plugins"]},
    }
    seen = set()
    for entry in data["entries"]:
        slug = entry["id"]
        assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug), slug
        assert slug not in seen, f"Duplicate catalog id: {slug}"
        seen.add(slug)
        assert entry["topic"] in data["topics"] and entry["format"] in formats, slug
        assert entry["title"] and entry["description"], slug
        assert (ROOT / entry["image"]).is_file(), slug
        assert (ROOT / entry["readme_icon"]).is_file(), slug
        if entry["format"] in ("browser-app", "training"):
            assert (ROOT / "apps" / slug / "index.html").is_file(), slug
            assert entry["online_url"] == SITE + f"apps/{slug}/", slug
            assert entry["offline_release_url"].startswith(REPO + "/releases/tag/"), slug
            tag = entry["offline_release_url"].split("/releases/tag/", 1)[1]
            assert entry["offline_zip_url"] == REPO + f"/releases/download/{tag}/{slug}.zip", slug
            if html_url := entry.get("standalone_html_url"):
                assert html_url == REPO + f"/releases/download/{tag}/{slug}.html", slug
        elif entry["format"] == "ai-plugin":
            assert entry["source_url"] == REPO + f"/tree/main/plugins/{slug}", slug
            assert "fictional" in entry["starter_prompt"].lower(), f"Starter prompt needs fictional context: {slug}"
            assert entry["expected_result"] and entry["platforms"], slug
            for platform in entry["platforms"]:
                assert platform in marketplace_names, f"Unverified platform: {platform}"
                assert slug in marketplace_names[platform], f"Missing marketplace entry: {slug}"
                manifest = ROOT / "plugins" / slug / (
                    ".codex-plugin/plugin.json" if platform == "codex" else ".claude-plugin/plugin.json"
                )
                assert manifest.is_file(), f"Missing {platform} manifest: {slug}"
                assert json.loads(manifest.read_text())["name"] == slug, slug
            version = json.loads((ROOT / "plugins" / slug / ".codex-plugin/plugin.json").read_text())["version"]
            tag = f"{slug}-v{version}"
            assert entry["plugin_release_url"] == REPO + "/releases/tag/" + tag, slug
            assert entry["plugin_zip_url"] == REPO + f"/releases/download/{tag}/{slug}.zip", slug
        else:
            assert entry.get("primary_url"), slug
            if entry["format"] == "python-package":
                assert entry.get("requirements"), f"Missing Python requirements: {slug}"


def readme_row(entry: dict, format_: dict) -> str:
    icon, title, description = (entry[key] for key in ("readme_icon", "title", "description"))
    if entry["format"] == "browser-app":
        online, release, guide = (entry[key] for key in ("online_url", "offline_release_url", "guide_url"))
        download = entry.get("standalone_html_url", release)
        if entry["topic"] == "Procurement":
            return (f'    <tr><td><img src="{icon}" width="56" alt=""></td><td><strong>{title}</strong><br>'
                    f'{description}<br><a href="{online}">Try online</a> · <a href="{download}">Download</a>'
                    f' · <a href="{guide}">Guide</a></td></tr>')
        return (f'| <img src="{icon}" width="56" alt=""> | **{title}**<br>{description}<br>'
                f'[Try online]({online}) · [Download]({download}) · [Guide]({guide}) |')
    if entry["format"] == "training":
        online, release, guide = (entry[key] for key in ("online_url", "offline_release_url", "guide_url"))
        return (f'| <img src="{icon}" width="56" alt=""> | **{title}**<br>{description}<br>'
                f'[Watch]({online}) · [Download]({release}) · [Guide]({guide}) |')
    if entry["format"] == "ai-plugin":
        zip_url, release, source = (entry[key] for key in ("plugin_zip_url", "plugin_release_url", "source_url"))
        return (f'| <img src="{icon}" width="56" alt=""> | **{title}**<br>{description}<br>'
                f'<em>Try: “{entry["readme_prompt"]}”</em><br>[Download ZIP]({zip_url})'
                f' · [Release]({release}) · [Source]({source}) |')
    return (f'| <img src="{icon}" width="56" alt=""> | **{title}**<br>{description}<br>'
            f'[{format_["primary_label"]}]({entry["primary_url"]}) |')


def replace_marked(source: str, start: str, end: str, body: str) -> str:
    pattern = re.compile(rf'({re.escape(start)}\n)(.*?)({re.escape(end)})', re.DOTALL)
    source, count = pattern.subn(lambda match: match.group(1) + body + match.group(3), source)
    assert count == 1, f"Missing or duplicate README markers: {start}"
    return source


def generated_readme(source: str, data: dict) -> str:
    formats = {entry["id"]: entry for entry in data["formats"]}
    for topic in data["topics"]:
        for format_id, heading, summary in (
            ("browser-app", "### Browser apps", "See free browser tools"),
            ("ai-plugin", "### AI plugins", "See plugins for AI chatbots"),
        ):
            topic_start = source.index(f"## [{topic}]")
            topic_end = source.find("\n## ", topic_start + 1)
            if topic_end < 0:
                topic_end = len(source)
            topic_text = source[topic_start:topic_end]
            heading_pos = topic_text.find(heading)
            if heading_pos < 0:
                continue
            details_end = topic_text.index("</details>", heading_pos) + len("</details>")
            block = topic_text[heading_pos:details_end]
            group = [entry for entry in data["entries"] if entry["topic"] == topic and entry["format"] == format_id]
            assert group, f"Empty legacy README section: {topic} {format_id}"
            block, count = re.subn(rf'({re.escape(summary)} \()\d+(\))',
                                   lambda m: m.group(1) + str(len(group)) + m.group(2), block)
            assert count == 1, f"Missing README count: {topic} {format_id}"
            lines = block.splitlines(keepends=True)
            if format_id == "browser-app" and topic == "Procurement":
                row_indexes = [i for i, line in enumerate(lines) if line.startswith('    <tr><td><img')]
            else:
                row_indexes = [i for i, line in enumerate(lines) if line.startswith('| <img')]
            assert row_indexes and row_indexes == list(range(row_indexes[0], row_indexes[-1] + 1))
            rows = "".join(readme_row(entry, formats[entry["format"]]) + "\n" for entry in group)
            block = "".join(lines[:row_indexes[0]]) + rows + "".join(lines[row_indexes[-1] + 1:])
            source = source[:topic_start + heading_pos] + block + source[topic_start + details_end:]
        extras = []
        for format_ in data["formats"]:
            format_id = format_["id"]
            if format_id in ("browser-app", "ai-plugin"):
                continue
            group = [entry for entry in data["entries"] if entry["topic"] == topic and entry["format"] == format_id]
            if group:
                extras.extend((f'### {format_["label"]}', '', f'*{format_["instruction"]}*', '',
                               '<details markdown="1">',
                               f'<summary><strong>See {format_["label"].lower()} ({len(group)})</strong></summary>',
                               '', '|  |  |', '| --- | --- |', *(readme_row(entry, format_) for entry in group),
                               '', '</details>', ''))
        source = replace_marked(source, f"<!-- catalog-extra:{topic}:start -->",
                                f"<!-- catalog-extra:{topic}:end -->", "\n".join(extras))
    return source


def site_items(data: dict) -> list[dict]:
    items = []
    for entry in data["entries"]:
        item = {key: entry[key] for key in ("id", "title", "description", "image")}
        item.update(domain=entry["topic"], format=entry["format"])
        if entry["format"] in ("browser-app", "training"):
            item.update(primary_url=entry["online_url"], secondary_url=entry.get("standalone_html_url", entry["offline_zip_url"]))
        elif entry["format"] == "ai-plugin":
            item.update(primary_url=entry["plugin_zip_url"], starter_prompt=entry["starter_prompt"],
                        expected_result=entry["expected_result"])
        else:
            item["primary_url"] = entry["primary_url"]
            if entry.get("secondary_url"):
                item["secondary_url"] = entry["secondary_url"]
            if entry.get("requirements"):
                item["requirements"] = entry["requirements"]
        items.append(item)
    return items


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if generated outputs are stale")
    args = parser.parse_args()
    data = json.loads((ROOT / "support/catalog.json").read_text(encoding="utf-8"))
    validate(data)
    items = site_items(data)
    catalog_js = ("window.catalogFormats = " + json.dumps(data["formats"], ensure_ascii=False, indent=2) + ";\n"
                  "window.catalogItems = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n")
    index = ROOT / "index.html"
    expected_index = versioned_homepage(index.read_text(encoding="utf-8"), {
        "catalog.js": catalog_js.encode(), "app.js": (ROOT / "app.js").read_bytes(),
        "style.css": (ROOT / "style.css").read_bytes(),
        "copy-prompt.js": (ROOT / "copy-prompt.js").read_bytes(),
    })
    readme = ROOT / "README.md"
    outputs = {ROOT / "catalog.js": catalog_js, index: expected_index,
               readme: generated_readme(readme.read_text(encoding="utf-8"), data)}
    for path, expected in outputs.items():
        if args.check:
            assert path.is_file() and path.read_text(encoding="utf-8") == expected, f"Stale: {path.relative_to(ROOT)}"
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(expected, encoding="utf-8")
    print(f"{'Checked' if args.check else 'Wrote'} {len(items)} catalog items")


if __name__ == "__main__":
    main()
