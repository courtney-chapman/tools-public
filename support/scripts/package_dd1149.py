#!/usr/bin/env python3
"""Build the standalone DD1149 ZIP from an explicit public-file allowlist."""

from __future__ import annotations

import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "apps/dd1149-generator"
OUTPUT = ROOT / ".build/app-zips/dd1149-generator.zip"
FILES = ("LICENSE", "README.md", "app.js", "index.html", "styles.css", "tokens.css")
STAMP = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    actual = {path.name for path in APP.iterdir() if path.is_file()}
    if actual != set(FILES) or any((APP / name).is_symlink() for name in FILES):
        raise ValueError(f"unexpected app files: {sorted(actual ^ set(FILES))}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w") as archive:
        for name in FILES:
            info = ZipInfo(f"dd1149-generator/{name}", date_time=STAMP)
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (APP / name).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
    with ZipFile(OUTPUT) as archive:
        if archive.testzip() or archive.namelist() != [f"dd1149-generator/{name}" for name in FILES]:
            raise ValueError("invalid DD1149 ZIP")
    print(f"{OUTPUT}  sha256:{hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
