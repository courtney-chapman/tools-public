#!/usr/bin/env python3
"""Validate the released plugin catalog and repository structure."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CATALOG_LINK = re.compile(
    r"\[Source\]\(https://github\.com/courtney-chapman/tools-public/tree/main/plugins/([^/)]+)\)"
)
APP_CATALOG_URL = "https://courtney-chapman.github.io/tools-public/"
APP_FOOTER_NOTE = "Provided as-is · Review outputs before use"
APP_SHELL_MARKER = "Shared app shell. Keep this block identical in every standalone app."


class AppFooterParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_footer = False
        self.text: list[str] = []
        self.links: list[str | None] = []
        self.count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "footer":
            self.in_footer = True
            self.count += 1
        elif tag == "a" and self.in_footer:
            self.links.append(dict(attrs).get("href"))

    def handle_endtag(self, tag: str) -> None:
        if tag == "footer":
            self.in_footer = False

    def handle_data(self, data: str) -> None:
        if self.in_footer:
            self.text.append(data)


def validate() -> list[str]:
    errors: list[str] = []
    app_shell_styles: set[str] = set()
    app_header_markup: set[str] = set()
    app_footer_markup: set[str] = set()
    marketplace_path = ROOT / ".agents/plugins/marketplace.json"
    try:
        marketplace = json.loads(marketplace_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"invalid marketplace catalog: {exc}"]

    plugin_dirs = {path.name for path in (ROOT / "plugins").iterdir() if path.is_dir()}
    entries = marketplace.get("plugins")
    if not isinstance(entries, list):
        return ["marketplace plugins must be a list"]

    entry_names = {entry.get("name") for entry in entries if isinstance(entry, dict)}
    if len(entry_names) != len(entries):
        errors.append("marketplace plugin names must be present and unique")
    if plugin_dirs != entry_names:
        errors.append(
            f"plugin folders differ from marketplace entries: folders={sorted(plugin_dirs)}, "
            f"entries={sorted(str(name) for name in entry_names)}"
        )

    claude_marketplace_path = ROOT / ".claude-plugin/marketplace.json"
    try:
        claude_marketplace = json.loads(claude_marketplace_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid Claude marketplace catalog: {exc}")
        claude_marketplace = {}
    claude_entries = claude_marketplace.get("plugins") if isinstance(claude_marketplace, dict) else None
    if not isinstance(claude_entries, list):
        errors.append("Claude marketplace plugins must be a list")
        claude_entries = []
    claude_names = [
        entry.get("name") if isinstance(entry, dict) and isinstance(entry.get("name"), str) else None
        for entry in claude_entries
    ]
    codex_names = [entry.get("name") for entry in entries if isinstance(entry, dict)]
    if claude_names != codex_names:
        errors.append("Claude marketplace plugins must match Codex marketplace names and order")
    if len(set(claude_names)) != len(claude_names):
        errors.append("Claude marketplace plugin names must be unique")
    for entry in claude_entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("name"), str):
            errors.append("Claude marketplace entries must have a plugin name")
            continue
        name = entry["name"]
        if entry.get("source") != f"./plugins/{name}":
            errors.append(f"invalid Claude marketplace source for {name}")
        if "version" in entry:
            errors.append(f"Claude marketplace version must come from plugin.json for {name}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    catalog_plugins = set(CATALOG_LINK.findall(readme))
    if catalog_plugins != plugin_dirs:
        errors.append(
            f"README catalog differs from plugin folders: catalog={sorted(catalog_plugins)}, "
            f"folders={sorted(plugin_dirs)}"
        )

    tracked_markdown = subprocess.run(
        ["git", "ls-files", "*.md"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()
    for relative_path in tracked_markdown:
        path = ROOT / relative_path
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for raw in MARKDOWN_LINK.findall(line):
                target = raw.strip().split()[0].strip("<>").split("#", 1)[0]
                if not target or re.match(r"^[A-Za-z][\w+.-]*:", target):
                    continue
                if not (path.parent / target).resolve().exists():
                    errors.append(f"{relative_path}:{number}: broken local link: {raw}")

    catalog = json.loads((ROOT / "support/catalog.json").read_text(encoding="utf-8"))
    training_ids = {entry["id"] for entry in catalog["entries"] if entry["format"] == "training"}
    for index_path in sorted((ROOT / "apps").glob("*/index.html")):
        markup = index_path.read_text(encoding="utf-8")
        if index_path.parent.name in training_ids:
            footer = AppFooterParser()
            footer.feed(markup)
            if footer.count != 2 or "Built by Courtney" not in " ".join(footer.text) or APP_CATALOG_URL not in footer.links:
                errors.append(f"{index_path.parent.name}: training footer credit or More tools link is missing")
            if not all(term in markup for term in ("<title>", 'name="description"', 'property="og:title"', "What this training covers")):
                errors.append(f"{index_path.parent.name}: training metadata or summary is missing")
            if re.search(r"<(?:script|link)\b[^>]*(?:src|href)=[\"\'](?!https://courtney-chapman.github.io/tools-public/)", markup, re.IGNORECASE):
                errors.append(f"{index_path.parent.name}: training uses an external script or style")
            continue
        footer = AppFooterParser()
        footer.feed(markup)
        label = index_path.parent.name
        text = " ".join(footer.text)
        token_path = index_path.parent / "tokens.css"
        token_link = re.search(r'<link\b[^>]*href=["\']tokens\.css["\'][^>]*>', markup, re.IGNORECASE)
        app_style = re.search(r'<style\b|<link\b[^>]*href=["\'](?:styles|style)\.css', markup, re.IGNORECASE)
        if not token_path.is_file() or not token_link or (app_style and token_link.start() > app_style.start()):
            errors.append(f"{label}: local brand tokens must load before app styles")
        else:
            token_styles = token_path.read_text(encoding="utf-8")
            if APP_SHELL_MARKER not in token_styles:
                errors.append(f"{label}: shared app shell styles are missing")
            else:
                app_shell_styles.add(token_styles.split("/* " + APP_SHELL_MARKER, 1)[1])
        header = re.search(r"<header\b([^>]*)>(.*?)</header>", markup, re.IGNORECASE | re.DOTALL)
        if not header or not re.search(r'\bapp-brand-header\b', header.group(1)):
            errors.append(f"{label}: shared app header is missing")
        elif (
            len(re.findall(r"<h1\b", header.group(2), re.IGNORECASE)) != 1
            or "Standalone offline demonstration" not in header.group(2)
            or "app-brand-header__inner" not in header.group(2)
        ):
            errors.append(f"{label}: shared app header needs its title and eyebrow")
        else:
            normalized = re.sub(r"<h1>.*?</h1>", "<h1>APP NAME</h1>", header.group(), flags=re.DOTALL)
            normalized = re.sub(r'<header class="[^"]+">', '<header class="app-brand-header">', normalized)
            app_header_markup.add(normalized)
        if not re.search(r'<div class="app-brand-intro"><p>[^<]+</p>', markup):
            errors.append(f"{label}: task description is missing below the header")
        csp = re.search(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>', markup, re.IGNORECASE)
        if csp and "style-src" in csp.group() and "'self'" not in csp.group():
            errors.append(f"{label}: content security policy blocks local brand tokens")
        if not re.search(r'<meta\b[^>]*name=["\']color-scheme["\'][^>]*content=["\']light dark["\']', markup, re.IGNORECASE):
            errors.append(f"{label}: missing light/dark color-scheme metadata")
        if footer.count != 1:
            errors.append(f"{label}: expected one app footer")
        else:
            footer_markup = re.search(r"<footer\b[^>]*>.*?</footer>", markup, re.IGNORECASE | re.DOTALL)
            if footer_markup:
                app_footer_markup.add(footer_markup.group())
        if "Built by Courtney" not in text or APP_CATALOG_URL not in footer.links:
            errors.append(f"{label}: footer credit or More tools link is missing")
        if APP_FOOTER_NOTE not in text:
            errors.append(f"{label}: shared as-is footer note is missing")
        if re.search(r"\bRevision\s+\d+\b", text, re.IGNORECASE):
            errors.append(f"{label}: internal revision is visible in footer")

    if len(app_shell_styles) > 1:
        errors.append("shared app shell styles differ across standalone apps")
    if len(app_header_markup) > 1:
        errors.append("shared app header markup differs beyond the app name")
    if len(app_footer_markup) > 1:
        errors.append("shared app footer markup differs across standalone apps")

    for name in sorted(plugin_dirs):
        manifest_path = ROOT / "plugins" / name / ".codex-plugin/plugin.json"
        claude_manifest_path = ROOT / "plugins" / name / ".claude-plugin/plugin.json"
        skill_path = ROOT / "plugins" / name / "skills" / name / "SKILL.md"
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"invalid plugin manifest for {name}: {exc}")
            continue
        if manifest.get("name") != name:
            errors.append(f"manifest name differs for {name}: {manifest.get('name')!r}")
        if not skill_path.is_file():
            errors.append(f"missing primary skill for {name}: {skill_path.relative_to(ROOT)}")
        try:
            claude_manifest = json.loads(claude_manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"invalid Claude plugin manifest for {name}: {exc}")
            continue
        if claude_manifest.get("name") != name:
            errors.append(f"Claude manifest name differs for {name}: {claude_manifest.get('name')!r}")
        if claude_manifest.get("version") != manifest.get("version"):
            errors.append(f"Claude and Codex manifest versions differ for {name}")
        interface = manifest.get("interface")
        description = interface.get("longDescription") if isinstance(interface, dict) else None
        if claude_manifest.get("description") != description:
            errors.append(f"Claude manifest description differs from Codex for {name}")
        if not isinstance(interface, dict):
            errors.append(f"missing Codex interface for {name}")
        else:
            if len(interface.get("displayName", "")) > 30:
                errors.append(f"Codex display name exceeds 30 characters for {name}")
            if len(interface.get("shortDescription", "")) > 30:
                errors.append(f"Codex short description exceeds 30 characters for {name}")
            prompts = interface.get("defaultPrompt", [])
            if isinstance(prompts, str):
                prompts = [prompts]
            if not isinstance(prompts, list) or len(prompts) > 3 or any(
                not isinstance(prompt, str) or len(prompt) > 128 for prompt in prompts
            ):
                errors.append(f"invalid Codex starter prompts for {name}")
            if interface.get("websiteURL") != "https://github.com/courtney-chapman":
                errors.append(f"missing requested website URL for {name}")
            for field in ("logo", "composerIcon"):
                icon_path = interface.get(field)
                if icon_path != "./assets/icon.png":
                    errors.append(f"invalid {field} path for {name}")
                    continue
                icon = ROOT / "plugins" / name / icon_path
                data = icon.read_bytes() if icon.is_file() else b""
                if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) < 24:
                    errors.append(f"missing PNG {field} for {name}")
                elif int.from_bytes(data[16:20], "big") != 240 or int.from_bytes(data[20:24], "big") != 240:
                    errors.append(f"invalid {field} dimensions for {name}")
        if manifest.get("author", {}).get("url") != "https://github.com/courtney-chapman":
            errors.append(f"missing author URL for {name}")
        if manifest.get("homepage") != f"https://github.com/courtney-chapman/tools-public/tree/main/plugins/{name}":
            errors.append(f"invalid homepage for {name}")
        if manifest.get("repository") != "https://github.com/courtney-chapman/tools-public":
            errors.append(f"invalid repository URL for {name}")
        if manifest.get("license") != "CC-BY-NC-4.0":
            errors.append(f"invalid license identifier for {name}")
        matching_entries = [entry for entry in claude_entries if isinstance(entry, dict) and entry.get("name") == name]
        if len(matching_entries) == 1 and matching_entries[0].get("description") != claude_manifest.get("description"):
            errors.append(f"Claude marketplace description differs from manifest for {name}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("Repository validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Repository validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
