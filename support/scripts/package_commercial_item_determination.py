#!/usr/bin/env python3
"""Build the offline commerciality app from an explicit public-file allowlist."""

from __future__ import annotations

import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[2]
NAME = "commercial-item-determination"
APP = ROOT / "apps" / NAME
OUTPUT = ROOT / ".build/app-zips" / f"{NAME}.zip"
FILES = ("index.html", "tokens.css", "README.md", "LICENSE")
STAMP = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    actual = {path.relative_to(APP).as_posix() for path in APP.rglob("*") if path.is_file() or path.is_symlink()}
    if actual != set(FILES) or any(path.is_symlink() for path in APP.rglob("*")):
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
            raise ValueError("invalid commerciality app ZIP")
        if any(archive.read(f"{NAME}/{name}") != (APP / name).read_bytes() for name in FILES):
            raise ValueError("ZIP content differs from app source")
    print(f"{OUTPUT}  sha256:{hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
