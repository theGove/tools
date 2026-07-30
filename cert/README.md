# Local HTTPS setup

`tools/cert/` is gitignored — nothing in this folder is shared via git. Every
developer generates their own local CA and cert here and trusts it on their
own machine. This keeps CA private keys off of everyone else's disk while
still letting Live Server (or Vite) serve `https://local.availabooks.com`
without browser warnings.

Domains covered by the cert: `local.availabooks.com`, `localhost`,
`vite.availabooks.com`, `127.0.0.1`.

## 1. Install mkcert

```
npm install -g mkcert
```

## 2. Generate a CA and a cert, from this directory (`tools/cert/`)

```
mkcert create-ca --organization "availabooks local dev CA" --validity 3650 --key ca.key --cert ca.crt
mkcert create-cert --ca-key ca.key --ca-cert ca.crt --validity 825 \
  --domains local.availabooks.com localhost vite.availabooks.com 127.0.0.1 \
  --key key.pem --cert cert.pem
```

This produces `ca.key`, `ca.crt`, `key.pem`, `cert.pem`. Only `ca.crt` needs
to leave this machine (step 3); the others stay local.

## 3. Trust the CA

**Windows** (no admin required, installs to your user's trust store):

```
certutil -user -addstore -f "ROOT" ca.crt
```

**macOS**:

```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ca.crt
```

Restart your browser after this step — root store changes aren't picked up
by an already-running browser process.

## 4. Map the domain to localhost

Add to your hosts file:

- Windows: `C:\Windows\System32\drivers\etc\hosts` (edit as Administrator)
- macOS/Linux: `/etc/hosts` (edit with `sudo`)

```
127.0.0.1 local.availabooks.com
```

## 5. Point Live Server at the cert

`.vscode/settings.json` (already configured in this repo) expects:

```json
"liveServer.settings.https": {
    "enable": true,
    "cert": "<absolute path to tools/cert/cert.pem>",
    "key": "<absolute path to tools/cert/key.pem>",
    "passphrase": ""
},
"liveServer.settings.host": "local.availabooks.com"
```

Adjust the absolute paths for your own machine/OS.
