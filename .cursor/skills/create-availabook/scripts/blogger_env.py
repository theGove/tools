"""Load Blogger credentials from tools/.env and OAuth client files."""

from __future__ import annotations

import os
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parents[4]
ENV_PATH = TOOLS_DIR / ".env"
CREDENTIALS_PATH = TOOLS_DIR / "credentials.json"
TOKEN_PATH = TOOLS_DIR / "token.json"

BLOGGER_SCOPE = "https://www.googleapis.com/auth/blogger"
SOURCE_BLOG_URL = "https://book1011.blogspot.com/"
SOURCE_BLOG_ID = "1676106165289640444"


def load_dotenv(path: Path = ENV_PATH) -> dict[str, str]:
    """
    Parse a simple KEY=VALUE .env file into a dict (does not export to os.environ).
    @param {Path} path - Path to the .env file.
    """
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_api_key() -> str:
    """Return BLOGGER_API_KEY from .env or the environment."""
    env = load_dotenv()
    key = env.get("BLOGGER_API_KEY") or os.environ.get("BLOGGER_API_KEY")
    if not key:
        raise SystemExit(
            f"Missing BLOGGER_API_KEY. Add it to {ENV_PATH} or export it."
        )
    return key


def get_oauth_credentials(interactive: bool = True):
    """
    Return google.oauth2.credentials.Credentials for Blogger write access.

    Prefers tools/credentials.json + tools/token.json (refreshable). Falls back
    to BLOGGER_ACCESS_TOKEN in .env for one-off tokens.
    @param {bool} interactive - If True, open a browser login when needed.
    """
    env = load_dotenv()
    static_token = env.get("BLOGGER_ACCESS_TOKEN") or os.environ.get(
        "BLOGGER_ACCESS_TOKEN"
    )

    if CREDENTIALS_PATH.is_file():
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow

        creds = None
        if TOKEN_PATH.is_file():
            creds = Credentials.from_authorized_user_file(
                str(TOKEN_PATH), [BLOGGER_SCOPE]
            )

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
            return creds

        if creds and creds.valid:
            return creds

        if not interactive:
            raise SystemExit(
                f"No valid OAuth token at {TOKEN_PATH}. "
                "Run: python .cursor/skills/create-availabook/scripts/auth_login.py"
            )

        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_PATH), [BLOGGER_SCOPE]
        )
        creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
        return creds

    if static_token:
        from google.oauth2.credentials import Credentials

        return Credentials(token=static_token)

    raise SystemExit(
        "No OAuth credentials found.\n"
        f"Put your OAuth client file at {CREDENTIALS_PATH}\n"
        "then run: python .cursor/skills/create-availabook/scripts/auth_login.py\n"
        "Or set BLOGGER_ACCESS_TOKEN in .env as a fallback."
    )


def get_access_token(interactive: bool = True) -> str | None:
    """
    Return a bearer access token for write operations.
    @param {bool} interactive - If True, open a browser login when needed.
    """
    try:
        creds = get_oauth_credentials(interactive=interactive)
    except SystemExit:
        return None
    if not creds or not creds.token:
        return None
    return creds.token


def require_access_token(interactive: bool = True) -> str:
    """
    Return a usable access token or exit with setup instructions.
    @param {bool} interactive - If True, open a browser login when needed.
    """
    token = get_access_token(interactive=interactive)
    if not token:
        raise SystemExit(
            "Could not obtain a Blogger OAuth access token.\n"
            f"1. Download an OAuth Desktop client as {CREDENTIALS_PATH}\n"
            "2. Run: python .cursor/skills/create-availabook/scripts/auth_login.py\n"
            "3. Sign in with the Google account that owns your blogs"
        )
    return token
