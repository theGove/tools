# Certificate for local.availabooks.com

Put these in the .vscode/settings.json file at the root of our project, probs in the availabooks dir.

```json
"liveServer.settings.https": {
    "enable": true,
    "cert": "/absolute/path/to/tools/cert/cert.pem",
    "key": "/absolute/path/to/tools/cert/key.pem",
    "passphrase": ""
},
"liveServer.settings.host": "local.availabooks.com",
"liveServer.settings.port": 5500
```