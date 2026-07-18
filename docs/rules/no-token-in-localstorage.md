# no-token-in-localstorage

Disallow storing authentication tokens, JWTs, or secrets in `localStorage` /
`sessionStorage`.

## Rule details

Web storage is synchronous, origin-scoped, and — crucially — readable by **any**
JavaScript running on the page. A single cross-site scripting (XSS) flaw, or a
compromised third-party script, can read every key you have written. Auth tokens
are the highest-value target: once exfiltrated they let an attacker impersonate
the user until the token expires.

This rule flags writes whose **key** looks like it holds a credential. Matching
is case-insensitive and substring-based against a configurable list. It inspects
both `setItem` calls and direct member assignments, including `window`-prefixed
forms.

Prefer keeping short-lived access tokens in memory (a module-scoped variable or
in-memory store) and refresh tokens in an `HttpOnly`, `Secure`, `SameSite`
cookie that JavaScript cannot read.

## Incorrect

```js
localStorage.setItem("authToken", token);
sessionStorage.setItem("jwt", jwt);
localStorage.apiKey = apiKey;
window.localStorage.setItem("refresh_token", rt);
```

## Correct

```js
// Keep the access token in memory only.
let accessToken = token;

// Non-sensitive UI state is fine in web storage.
localStorage.setItem("theme", "dark");
```

## Options

```jsonc
{
  "storage-security/no-token-in-localstorage": [
    "error",
    {
      // Case-insensitive substrings that mark a key as sensitive.
      // Supplying this list replaces the built-in defaults.
      "patterns": ["token", "jwt", "auth", "secret", "password", "apiKey"]
    }
  ]
}
```

## Further reading

- [Securing auth tokens in browser storage](https://www.browser-storage.com/storage-security-encryption-privacy/securing-auth-tokens-in-browser-storage/)
- [Why JWT in localStorage is XSS-vulnerable](https://www.browser-storage.com/storage-security-encryption-privacy/securing-auth-tokens-in-browser-storage/why-jwt-in-localstorage-is-xss-vulnerable/)
