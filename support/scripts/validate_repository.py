#!/usr/bin/env python3
"""Validate the released plugin catalog and repository structure."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CATALOG_LINK = re.compile(r"\]\(plugins/([^/]+)/")


def validate() -> list[str]:
    errors: list[str] = []
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

    for name in sorted(plugin_dirs):
        manifest_path = ROOT / "plugins" / name / ".codex-plugin/plugin.json"
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
