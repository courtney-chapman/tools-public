#!/usr/bin/env python3
"""Build reproducible, single-plugin ZIPs from marketplace source files."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / ".build/plugin-zips"
STAMP = (1980, 1, 1, 0, 0, 0)


def add_file(archive: ZipFile, name: str, data: bytes) -> None:
    info = ZipInfo(name, date_time=STAMP)
    info.compress_type = ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)


def main() -> None:
    catalog = json.loads((ROOT / ".agents/plugins/marketplace.json").read_text())
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin", help="package only this marketplace plugin")
    args = parser.parse_args()
    entries = catalog["plugins"]
    if args.plugin and args.plugin not in {entry["name"] for entry in entries}:
        parser.error(f"unknown marketplace plugin: {args.plugin}")
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z", "--", "plugins"], cwd=ROOT
    ).decode().strip("\0").split("\0")
    license_bytes = (ROOT / "LICENSE").read_bytes()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not args.plugin:
        expected_zips = {f'{entry["name"]}.zip' for entry in entries}
        stale_zips = {path.name for path in OUTPUT.glob("*.zip")} - expected_zips
        if stale_zips:
            raise ValueError(f"remove stale plugin ZIPs before release: {sorted(stale_zips)}")

    for entry in entries:
        name = entry["name"]
        if args.plugin and name != args.plugin:
            continue
        source = entry["source"]["path"]
        if source != f"./plugins/{name}":
            raise ValueError(f"unexpected plugin source for {name}: {source}")
        plugin_root = ROOT / "plugins" / name
        manifest_path = f"{name}/.codex-plugin/plugin.json"
        claude_manifest_path = f"{name}/.claude-plugin/plugin.json"
        skill_path = f"{name}/skills/{name}/SKILL.md"
        references = plugin_root / "skills" / name / "references"
        reference_files = (
            {str(path.relative_to(ROOT)) for path in references.rglob("*.md")}
            if references.exists()
            else set()
        )
        files = sorted(
            {path for path in tracked if path.startswith(f"plugins/{name}/")}
            | reference_files
        )
        if not files or any(path == f"plugins/{name}/LICENSE" for path in files):
            raise ValueError(f"missing plugin files or conflicting license: {name}")

        destination = OUTPUT / f"{name}.zip"
        with ZipFile(destination, "w") as archive:
            for path in files:
                file = ROOT / path
                if not file.is_file() or file.is_symlink():
                    raise ValueError(f"unsafe plugin file: {path}")
                add_file(archive, f"{name}/{file.relative_to(plugin_root)}", file.read_bytes())
            add_file(archive, f"{name}/LICENSE", license_bytes)

        with ZipFile(destination) as archive:
            names = archive.namelist()
            if (
                manifest_path not in names
                or claude_manifest_path not in names
                or skill_path not in names
                or archive.testzip()
            ):
                raise ValueError(f"invalid plugin ZIP: {destination}")
            codex_manifest = json.loads(archive.read(manifest_path))
            claude_manifest = json.loads(archive.read(claude_manifest_path))
            if codex_manifest["name"] != name or claude_manifest["name"] != name:
                raise ValueError(f"plugin manifest mismatch: {name}")
            if codex_manifest["version"] != claude_manifest["version"]:
                raise ValueError(f"plugin manifest version mismatch: {name}")
            for field in ("logo", "composerIcon"):
                icon = codex_manifest.get("interface", {}).get(field)
                if not isinstance(icon, str) or not icon.startswith("./"):
                    raise ValueError(f"invalid {field} path for {name}")
                if f"{name}/{icon[2:]}" not in names:
                    raise ValueError(f"missing packaged {field} for {name}")
            if any(not path.startswith(f"{name}/") for path in names):
                raise ValueError(f"multiple plugin roots: {destination}")
            skill_text = archive.read(skill_path).decode("utf-8")
            referenced_files = set(
                re.findall(r"references/[A-Za-z0-9._/-]+", skill_text)
            )
            missing_references = sorted(
                path for path in referenced_files if f"{name}/skills/{name}/{path}" not in names
            )
            if missing_references:
                raise ValueError(
                    f"missing referenced files in {destination}: {missing_references}"
                )

        digest = hashlib.sha256(destination.read_bytes()).hexdigest()
        print(f"{destination.name}  sha256:{digest}")


if __name__ == "__main__":
    main()
