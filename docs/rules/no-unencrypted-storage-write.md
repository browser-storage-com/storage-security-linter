# no-unencrypted-storage-write

Encourage routing `localStorage` / `sessionStorage` writes through an approved
encryption wrapper.

## Rule details

This is an **advisory** rule and is **off by default** in the `recommended`
preset because whether a given write needs encryption depends on your threat
model. Enable it in code paths that persist sensitive data client-side.

When enabled, the rule flags any meaningful value written to web storage that is
not produced by an approved wrapper call (for example `encrypt(...)` or
`secureStore(...)`). Booleans, numbers, and empty strings are ignored to reduce
noise. `await`-ed wrapper calls are recognised.

The intent is a nudge toward a single, auditable encryption boundary — typically
built on the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
— rather than ad-hoc plaintext writes scattered through the codebase.

## Incorrect

```js
localStorage.setItem("profile", profile);
localStorage.setItem("data", { a: 1 });
localStorage.session = payload;
```

## Correct

```js
localStorage.setItem("profile", await encrypt(profile));
sessionStorage.setItem("data", secureStore(data));
```

## Options

```jsonc
{
  "storage-security/no-unencrypted-storage-write": [
    "warn",
    {
      // Callee names treated as encryption / secure-store wrappers.
      "wrappers": ["encrypt", "secureStore", "seal"]
    }
  ]
}
```

## Further reading

- [Encrypting browser storage with Web Crypto](https://www.browser-storage.com/storage-security-encryption-privacy/encrypting-browser-storage-with-web-crypto/)
