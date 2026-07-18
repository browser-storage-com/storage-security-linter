# eslint-plugin-storage-security

An ESLint plugin that flags risky browser-storage usage — auth tokens and PII in
`localStorage`, writes that can throw without a `try`/`catch`, and unguarded
`JSON.parse` of stored data — and points you at safer patterns.

Web storage (`localStorage`, `sessionStorage`, `indexedDB`) is convenient but
easy to misuse: it is readable by any script on the origin, throws on quota and
in private-browsing modes, and hands you back arbitrary strings that may no
longer be valid JSON. These rules catch the common footguns at lint time.

## Why

- **XSS turns stored tokens into stolen sessions.** Anything in web storage is
  reachable by injected or third-party scripts.
- **PII in storage is unencrypted and persistent**, with privacy and compliance
  implications.
- **`setItem` throws** on `QuotaExceededError` and in some privacy modes.
- **`JSON.parse` of stored data throws** on corrupt or tampered input.

## Install

This package is distributed via GitHub (it is **not** published to the npm
registry):

```sh
npm install --save-dev github:browser-storage-com/storage-security-linter
```

It has no runtime dependencies. ESLint is a peer dependency (`eslint >=8`).

## Usage

### Flat config (ESLint 9+)

```js
// eslint.config.js
import storageSecurity from "eslint-plugin-storage-security";

export default [
  storageSecurity.configs["flat/recommended"],
];
```

Or wire it up manually:

```js
import storageSecurity from "eslint-plugin-storage-security";

export default [
  {
    plugins: { "storage-security": storageSecurity },
    rules: {
      "storage-security/no-token-in-localstorage": "error",
      "storage-security/require-try-catch-storage": "error",
    },
  },
];
```

### Legacy config (`.eslintrc`)

```jsonc
{
  "plugins": ["storage-security"],
  "extends": ["plugin:storage-security/recommended"]
}
```

## Presets

| Preset | Config key | Notes |
| --- | --- | --- |
| Recommended (flat) | `configs["flat/recommended"]` | Enables all rules except the advisory `no-unencrypted-storage-write`. |
| All (flat) | `configs["flat/all"]` | Enables every rule. |
| Recommended (legacy) | `plugin:storage-security/recommended` | Same rule set, `.eslintrc` style. |
| All (legacy) | `plugin:storage-security/all` | Every rule, `.eslintrc` style. |

## Rules

| Rule | Description | Recommended | Fixable |
| --- | --- | :---: | :---: |
| [no-token-in-localstorage](docs/rules/no-token-in-localstorage.md) | Disallow storing auth tokens / JWTs / secrets in web storage. | Yes | No |
| [no-sensitive-data-in-storage](docs/rules/no-sensitive-data-in-storage.md) | Disallow writing likely PII to web storage. | Yes | No |
| [require-try-catch-storage](docs/rules/require-try-catch-storage.md) | Require `try`/`catch` around `setItem` / `indexedDB.open`. | Yes | Suggestion |
| [no-json-parse-storage-without-catch](docs/rules/no-json-parse-storage-without-catch.md) | Require error handling around `JSON.parse` of stored values. | Yes | Suggestion |
| [no-unencrypted-storage-write](docs/rules/no-unencrypted-storage-write.md) | Encourage routing writes through an encryption wrapper. | No (advisory) | No |

### no-token-in-localstorage

Flags credential-like keys (`token`, `jwt`, `auth`, `secret`, `password`,
`apiKey`, …) written to `localStorage` / `sessionStorage`, via either
`setItem` or member assignment (`localStorage.token = …`), including
`window.`-prefixed forms. Keep short-lived tokens in memory and refresh tokens
in an `HttpOnly` cookie. Matching is case-insensitive and the pattern list is
configurable via the `patterns` option.

### no-sensitive-data-in-storage

Flags PII-like keys (`ssn`, `creditCard`, `cvv`, `dob`, `passport`, …) written
to web storage. Configure with `patterns` (replace defaults) or
`additionalPatterns` (extend defaults).

### require-try-catch-storage

Flags `setItem` and `indexedDB.open` calls that are not wrapped in a `try`
block, since they can throw `QuotaExceededError` or `SecurityError`. Provides a
suggestion to wrap the statement. Set `checkIndexedDB: false` to limit it to Web
Storage.

### no-json-parse-storage-without-catch

Flags `JSON.parse(localStorage.getItem(...))` (and `sessionStorage`) outside a
`try` block, where corrupt or tampered data would throw. Provides a suggestion
to wrap the statement.

### no-unencrypted-storage-write

Advisory rule, **off by default in `recommended`**. When enabled, warns on
meaningful writes that do not pass through an approved encryption wrapper.
Configure the accepted wrapper names with the `wrappers` option.

## Options at a glance

```jsonc
{
  "rules": {
    "storage-security/no-token-in-localstorage": [
      "error",
      { "patterns": ["token", "jwt", "auth", "secret", "password", "apiKey"] }
    ],
    "storage-security/no-sensitive-data-in-storage": [
      "error",
      { "additionalPatterns": ["employeeId"] }
    ],
    "storage-security/require-try-catch-storage": [
      "error",
      { "checkIndexedDB": true }
    ],
    "storage-security/no-unencrypted-storage-write": [
      "warn",
      { "wrappers": ["encrypt", "secureStore"] }
    ]
  }
}
```

## Further reading

Practical background on the problems these rules guard against:

- [Securing auth tokens in browser storage](https://www.browser-storage.com/storage-security-encryption-privacy/securing-auth-tokens-in-browser-storage/)
- [Why JWT in localStorage is XSS-vulnerable](https://www.browser-storage.com/storage-security-encryption-privacy/securing-auth-tokens-in-browser-storage/why-jwt-in-localstorage-is-xss-vulnerable/)
- [Encrypting browser storage with Web Crypto](https://www.browser-storage.com/storage-security-encryption-privacy/encrypting-browser-storage-with-web-crypto/)
- [Storage partitioning and privacy controls](https://www.browser-storage.com/storage-security-encryption-privacy/storage-partitioning-and-privacy-controls/)

## License

MIT © browser-storage.com

Maintained by the team behind [Browser Storage & Offline-First State Persistence](https://www.browser-storage.com/).
