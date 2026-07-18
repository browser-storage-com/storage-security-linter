# Changelog

All notable changes to this project are documented here. This project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-07-18

Initial release.

### Added

- `no-token-in-localstorage` — flags auth tokens / JWTs / secrets written to
  `localStorage` / `sessionStorage`.
- `no-sensitive-data-in-storage` — flags likely PII (SSN, credit card, CVV,
  DOB, and more) written to web storage.
- `no-unencrypted-storage-write` — advisory rule that encourages routing writes
  through an approved encryption wrapper (off by default in `recommended`).
- `require-try-catch-storage` — flags `setItem` / `indexedDB.open` writes that
  are not wrapped in `try`/`catch` (quota and security errors).
- `no-json-parse-storage-without-catch` — flags `JSON.parse(storage.getItem())`
  without error handling.
- `recommended` and `all` presets, plus flat-config presets
  `flat/recommended` and `flat/all` for ESLint 9.
