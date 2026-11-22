"""Build the GitHub Pages catalog from the public README."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path


THUMBNAIL_SLUG_ALIASES = {
    "commercial-item-determination": "commercial-product-service-cots-determination",
}
ROOT = Path(__file__).resolve().parents[2]


def versioned_homepage(html_text: str, assets: dict[str, bytes]) -> str:
    for name, content in assets.items():
        version = hashlib.sha256(content).hexdigest()[:12]
        pattern = rf'((?:src|href)="{re.escape(name)}\?v=)[^"]+'
        html_text, count = re.subn(pattern, lambda match: match.group(1) + version, html_text)
        assert count == 1, f"Expected one versioned {name} reference in index.html"
    return html_text


def link_map(row: str) -> dict[str, str]:
    links = dict(re.findall(r"\[([^]]+)\]\(([^)]+)\)", row))
    links.update((label, url) for url, label in re.findall(r'<a href="([^"]+)">([^<]+)</a>', row))
    return links


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if catalog.js or homepage asset versions are stale")
    args = parser.parse_args()
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    domain = kind = None
    items: list[dict[str, str]] = []
    for line in text.splitlines():
        heading = re.match(r"## \[?(Procurement|Government property|Contracts|Finance)", line)
        if heading:
            domain = heading.group(1)
            kind = None
            continue
        if line == "### Browser apps":
            kind = "app"
            continue
        if line == "### AI plugins":
            kind = "plugin"
            continue
        if not ("<tr><td><img" in line or line.startswith("| <img")):
            continue
        if kind == "app" and "<strong>" in line:
            title = re.search(r"<strong>(.*?)</strong>", line).group(1)
            description = re.search(r"</strong><br>(.*?)<br><a", line).group(1)
        else:
            title = re.search(r"\*\*(.*?)\*\*", line).group(1)
            description = re.search(r"\*\*<br>(.*?)<br>(?:<em>|\[)", line).group(1)
        links = link_map(line)
        if kind == "app":
            slug = re.search(r"/apps/([^/]+)/", links["Try online"]).group(1)
            thumb_slug = THUMBNAIL_SLUG_ALIASES.get(slug, slug)
            guide = links["Guide"]
            if not guide.startswith("https://"):
                guide = "https://github.com/courtney-chapman/tools-public/blob/main/" + guide
            item = {
                "domain": domain, "kind": kind, "title": html.unescape(title),
                "description": html.unescape(description),
                "image": "assets/thumbs/thumb_" + thumb_slug + ".png",
                "primary_url": links["Try online"], "primary_label": "Try online",
                "secondary_url": links["Download"], "secondary_label": "Download ZIP",
                "tertiary_url": guide, "tertiary_label": "Guide",
            }
        else:
            slug = re.search(r"/plugins/([^/)]+)", links["Source"]).group(1)
            release_tag = re.search(r"/releases/download/([^/]+)/", links["Download ZIP"]).group(1)
            release_url = links.get("Release", "https://github.com/courtney-chapman/tools-public/releases/tag/" + release_tag)
            assert release_url.endswith("/" + release_tag), (slug, release_url)
            item = {
                "domain": domain, "kind": kind, "title": html.unescape(title),
                "description": html.unescape(description),
                "image": "assets/thumbs/thumb_" + slug + ".png",
                "primary_url": links["Download ZIP"], "primary_label": "Download ZIP",
                "secondary_url": release_url,
                "secondary_label": "Release details",
                "tertiary_url": links["Source"], "tertiary_label": "Source",
            }
        items.append(item)
    assert items, "No catalog entries found in the README"
    identities = [(item["kind"], item["primary_url"]) for item in items]
    assert len(identities) == len(set(identities)), "Duplicate catalog entry"
    for item in items:
        assert (ROOT / item["image"]).is_file(), item["image"]
    output = ROOT / "catalog.js"
    rendered = "window.catalogItems = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"
    homepage = ROOT / "index.html"
    homepage_text = homepage.read_text(encoding="utf-8")
    expected_homepage = versioned_homepage(homepage_text, {
        "catalog.js": rendered.encode("utf-8"),
        "app.js": (ROOT / "app.js").read_bytes(),
        "style.css": (ROOT / "style.css").read_bytes(),
    })
    if args.check:
        assert output.read_text(encoding="utf-8") == rendered, "catalog.js is stale; run build_homepage_catalog.py"
        assert homepage_text == expected_homepage, "Homepage asset versions are stale; run build_homepage_catalog.py"
        print(f"Catalog and homepage asset versions are current: {len(items)} items")
    else:
        output.write_text(rendered, encoding="utf-8")
        homepage.write_text(expected_homepage, encoding="utf-8")
        print(f"Wrote {len(items)} catalog items and refreshed homepage asset versions")


if __name__ == "__main__":
    main()
