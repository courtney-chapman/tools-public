#!/usr/bin/env python3
"""Build the one-file Behind the Buy: The True Cost of a Supplier offline ZIP from the tracked public app."""

from __future__ import annotations

import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "apps/behind-the-buy-true-cost-of-a-supplier"
OUTPUT = ROOT / ".build/app-zips/behind-the-buy-true-cost-of-a-supplier.zip"
EXPECTED_HTML_SHA256 = "f75d7bb65d1f70653e2a8cd13fd4927f52bea06f28a3585299a8f5fbe819d2d8"
STAMP = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    expected_files = {"index.html", "README.md", "LICENSE"}
    actual_files = {path.relative_to(APP).as_posix() for path in APP.rglob("*") if path.is_file() or path.is_symlink()}
    if actual_files != expected_files or any(path.is_symlink() for path in APP.rglob("*")):
        raise ValueError(f"unexpected public app files: {sorted(actual_files ^ expected_files)}")
    html = (APP / "index.html").read_bytes()
    if hashlib.sha256(html).hexdigest() != EXPECTED_HTML_SHA256:
        raise ValueError("public HTML differs from approved candidate")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w") as archive:
        info = ZipInfo("index.html", date_time=STAMP)
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, html, compress_type=ZIP_DEFLATED, compresslevel=9)
    with ZipFile(OUTPUT) as archive:
        if archive.testzip() or archive.namelist() != ["index.html"] or archive.read("index.html") != html:
            raise ValueError("invalid Behind the Buy: The True Cost of a Supplier ZIP")
    print(f"{OUTPUT}  sha256:{hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
