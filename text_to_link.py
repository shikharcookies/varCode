#!/usr/bin/env python3
"""Create a public shareable link from text using paste.rs."""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request


PASTE_URL = "https://paste.rs"


def create_shareable_link(text: str) -> str:
    """Upload text and return a public URL."""
    if not text.strip():
        raise ValueError("Text cannot be empty.")

    data = text.encode("utf-8")
    request = urllib.request.Request(
        PASTE_URL,
        data=data,
        method="POST",
        headers={"Content-Type": "text/plain; charset=utf-8"},
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            url = response.read().decode("utf-8").strip()
    except urllib.error.URLError as err:
        raise RuntimeError(f"Upload failed: {err}") from err

    if not (url.startswith("http://") or url.startswith("https://")):
        raise RuntimeError("Unexpected response from paste service.")

    return url


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert text into a public shareable link."
    )
    parser.add_argument(
        "text",
        nargs="?",
        help="Text to upload. If omitted, text is read from standard input.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    text = args.text if args.text is not None else sys.stdin.read()

    try:
        link = create_shareable_link(text)
    except (ValueError, RuntimeError) as err:
        print(f"Error: {err}", file=sys.stderr)
        return 1

    print(link)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
