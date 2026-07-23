#!/usr/bin/env python3
"""One-time (or re-auth) browser login for Blogger OAuth using credentials.json."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from blogger_env import CREDENTIALS_PATH, TOKEN_PATH, get_oauth_credentials


def main() -> None:
    if not CREDENTIALS_PATH.is_file():
        raise SystemExit(
            f"Missing {CREDENTIALS_PATH}\n"
            "In Google Cloud Console: APIs & Services → Credentials → "
            "Create OAuth client ID → Desktop app → Download JSON, "
            "save it as tools/credentials.json"
        )

    print(f"Using client: {CREDENTIALS_PATH}")
    print("A browser window will open so you can authorize Blogger access...")
    creds = get_oauth_credentials(interactive=True)
    print(f"Saved refreshable token to {TOKEN_PATH}")
    print(f"Token valid: {bool(creds and creds.valid)}")
    if creds and creds.expiry:
        print(f"Access token expiry: {creds.expiry}")


if __name__ == "__main__":
    main()
