# Third-party components

This plugin ships two small helper modules that carry third-party MIT-licensed
code. Their copyright notices and the full license text are reproduced below
and in `THIRD_PARTY_LICENSE.txt`, as the MIT license requires.

- `utils/sentinel.py`, `utils/pkce.py` — MIT-licensed helper code.
  Copyright notice and license text: `THIRD_PARTY_LICENSE.txt`.
- `utils/web_pow.py`, `utils/turnstile.py` — reimplemented on the Python
  standard library only (`base64`, `hashlib.sha3_512`, `uuid`) from the
  reference algorithms; no third-party runtime dependency.

Everything else in `python/` (`auth_worker.py`, `image_worker.py`,
`web_text_worker.py`) is this project's own implementation.

`curl_cffi` is installed separately from PyPI into a local Python venv and is
not redistributed here.

The auth worker requests **Platform OAuth** (`platform.openai.com`); tokens are
not guaranteed to authenticate the separate Codex backend or ChatGPT Web
endpoints. This plugin verifies Codex access before admitting a token to its
pool, and handles `401` reauthentication and `429`/`5xx` failover cleanly.
