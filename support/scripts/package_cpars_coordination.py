#!/usr/bin/env python3
"""Build and verify the standalone CPARS Coordination Tracker ZIP."""

from __future__ import annotations

import hashlib
from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[2]
NAME = "cpars-coordination-tracker"
APP = ROOT / "apps" / NAME
OUTPUT = ROOT / ".build/app-zips" / f"{NAME}.zip"
HTML_OUTPUT = ROOT / ".build/app-zips" / f"{NAME}.html"
FILES = (
    "index.html",
    "tokens.css",
    "styles.css",
    "core.js",
    "app.js",
    "README.md",
    "REGULATORY_REFERENCES.md",
    "LICENSE",
)
STAMP = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    actual = {p.relative_to(APP).as_posix() for p in APP.rglob("*") if p.is_file() or p.is_symlink()}
    if actual != set(FILES) or any(p.is_symlink() for p in APP.rglob("*")):
        raise ValueError(f"unexpected app files: {sorted(actual ^ set(FILES))}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w") as archive:
        for name in FILES:
            info = ZipInfo(f"{NAME}/{name}", date_time=STAMP)
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (APP / name).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
    with ZipFile(OUTPUT) as archive:
        expected = [f"{NAME}/{name}" for name in FILES]
        if archive.testzip() or archive.namelist() != expected:
            raise ValueError("invalid CPARS Coordination ZIP")
        if any(archive.read(f"{NAME}/{name}") != (APP / name).read_bytes() for name in FILES):
            raise ValueError("ZIP content differs from app source")
    html = (APP / "index.html").read_text(encoding="utf-8")
    for name in ("tokens.css", "styles.css"):
        html = html.replace(f'<link rel="stylesheet" href="{name}">', f'<style>\n{(APP / name).read_text(encoding="utf-8")}\n</style>')
    scripts = []
    for name in ("core.js", "app.js"):
        html = html.replace(f'<script src="{name}" defer></script>', "")
        scripts.append(f'<script>\n{(APP / name).read_text(encoding="utf-8")}\n</script>')
    license_text = escape((APP / "LICENSE").read_text(encoding="utf-8"))
    html = html.replace("</body>", "\n".join(scripts) + f'\n<template id="license-text">{license_text}</template>\n</body>')
    if any(f'href="{name}"' in html for name in ("tokens.css", "styles.css")) or 'src="core.js"' in html or 'src="app.js"' in html:
        raise ValueError("standalone HTML still references local source files")
    HTML_OUTPUT.write_text(html, encoding="utf-8")
    print(f"{OUTPUT}  sha256:{hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")
    print(f"{HTML_OUTPUT}  sha256:{hashlib.sha256(HTML_OUTPUT.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
