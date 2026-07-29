#!/usr/bin/env python3
"""Create local TLS certs with mkcert for Availabooks local hosts.

Works on macOS, Linux, and Windows. Optional steps install mkcert and trust
its local CA; the cert directory is created when missing.

Examples:
  python create-cert.py
  python create-cert.py --install-mkcert --install-ca
  python create-cert.py --dir ~/.local/share/live-server-certs
"""

from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
import sys
from pathlib import Path

HOSTS = (
    "localhost",
    "127.0.0.1",
    "dev.availabooks.com",
    "local.availabooks.com",
)

DEFAULT_DIR = Path.home() / ".local" / "share" / "live-server-certs"


def die(message: str) -> None:
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=check, text=True)


def find_mkcert() -> str | None:
    return shutil.which("mkcert")


def install_mkcert() -> None:
    system = platform.system()

    if system == "Darwin":
        if not shutil.which("brew"):
            die(
                "Homebrew not found. Install it from https://brew.sh "
                "or install mkcert manually, then re-run."
            )
        run(["brew", "install", "mkcert"])
        return

    if system == "Windows":
        if shutil.which("choco"):
            run(["choco", "install", "mkcert", "-y"])
            return
        if shutil.which("scoop"):
            run(["scoop", "install", "mkcert"])
            return
        die(
            "Neither Chocolatey nor Scoop found. Install mkcert from "
            "https://github.com/FiloSottile/mkcert#windows, then re-run."
        )

    if system == "Linux":
        if shutil.which("brew"):
            run(["brew", "install", "mkcert"])
            return
        if shutil.which("apt-get"):
            run(["sudo", "apt-get", "update"])
            run(["sudo", "apt-get", "install", "-y", "mkcert", "libnss3-tools"])
            return
        if shutil.which("dnf"):
            run(["sudo", "dnf", "install", "-y", "mkcert", "nss-tools"])
            return
        if shutil.which("pacman"):
            run(["sudo", "pacman", "-S", "--noconfirm", "mkcert", "nss"])
            return
        die(
            "No supported package manager found. Install mkcert from "
            "https://github.com/FiloSottile/mkcert#linux, then re-run."
        )

    die(f"Unsupported platform: {system}")


def ensure_mkcert(*, do_install: bool) -> str:
    path = find_mkcert()
    if path:
        return path

    if not do_install:
        die(
            "mkcert not found on PATH. Re-run with --install-mkcert, "
            "or install it from https://github.com/FiloSottile/mkcert"
        )

    print("mkcert not found; installing...")
    install_mkcert()
    path = find_mkcert()
    if not path:
        die("mkcert was installed but is still not on PATH. Open a new shell and re-run.")
    return path


def install_ca(mkcert: str) -> None:
    run([mkcert, "-install"])


def create_certs(mkcert: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    cert_file = out_dir / "cert.pem"
    key_file = out_dir / "key.pem"
    run(
        [
            mkcert,
            "-cert-file",
            str(cert_file),
            "-key-file",
            str(key_file),
            *HOSTS,
        ]
    )
    print(f"Wrote {cert_file}")
    print(f"Wrote {key_file}")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Create local TLS certs with mkcert for localhost, 127.0.0.1, "
            "dev.availabooks.com, and local.availabooks.com."
        )
    )
    parser.add_argument(
        "--install-mkcert",
        action="store_true",
        help="Install mkcert via the platform package manager if it is missing",
    )
    parser.add_argument(
        "--install-ca",
        action="store_true",
        help="Run mkcert -install so the local CA is trusted by the OS/browser",
    )
    parser.add_argument(
        "--dir",
        type=Path,
        default=DEFAULT_DIR,
        help=f"Directory for cert.pem and key.pem (default: {DEFAULT_DIR})",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    out_dir = args.dir.expanduser().resolve()

    mkcert = ensure_mkcert(do_install=args.install_mkcert)

    if args.install_ca:
        install_ca(mkcert)

    create_certs(mkcert, out_dir)


if __name__ == "__main__":
    main()
