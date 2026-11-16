"""Check new commits for the repository owner's attribution.

The PR check runs before merging. The push check also inspects the final commit
GitHub creates for a squash or merge, which does not exist during PR validation.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys


OWNER_EMAIL = "256231750+courtney-chapman@users.noreply.github.com"
OWNER_NAMES = {"courtney-chapman", "Courtney", "Courtney's Portfolio"}
GITHUB_COMMITTER = ("GitHub", "noreply@github.com")
COAUTHOR_TRAILER = re.compile(r"(?im)^co-authored-by\s*:")


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def check_commit(sha: str) -> list[str]:
    fields = subprocess.check_output(
        [
            "git",
            "show",
            "-s",
            "--format=%an%x00%ae%x00%cn%x00%ce%x00%B",
            sha,
        ],
        text=True,
    ).split("\0", 4)
    author_name, author_email, committer_name, committer_email, message = fields
    errors = []
    if author_name not in OWNER_NAMES or author_email != OWNER_EMAIL:
        errors.append(f"{sha}: unexpected author {author_name} <{author_email}>")
    if (committer_name, committer_email) != GITHUB_COMMITTER and (
        committer_name not in OWNER_NAMES or committer_email != OWNER_EMAIL
    ):
        errors.append(
            f"{sha}: unexpected committer {committer_name} <{committer_email}>"
        )
    if COAUTHOR_TRAILER.search(message):
        errors.append(f"{sha}: Co-authored-by trailer requires owner review")
    return errors


def main() -> int:
    base = os.environ.get("ATTRIBUTION_BASE", "")
    head = os.environ.get("ATTRIBUTION_HEAD", "HEAD")
    if not base:
        print("ATTRIBUTION_BASE is required", file=sys.stderr)
        return 2
    if base == "0" * 40:
        print("Cannot verify attribution without a previous commit", file=sys.stderr)
        return 2
    try:
        commits = git("rev-list", "--reverse", f"{base}..{head}").splitlines()
    except subprocess.CalledProcessError as exc:
        print(f"Cannot inspect commit range {base}..{head}: {exc}", file=sys.stderr)
        return 2
    if not commits:
        print(f"No new commits in {base}..{head}")
        return 0
    errors = [error for sha in commits for error in check_commit(sha)]
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Verified author, committer, and message for {len(commits)} commit(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
