# require-try-catch-storage

Require storage writes that can throw to be wrapped in `try` / `catch`.

## Rule details

`localStorage.setItem` and `sessionStorage.setItem` are not infallible:

- They throw `QuotaExceededError` when the origin's storage budget is exhausted.
- They throw a `SecurityError` when storage is disabled — notably Safari private
  browsing historically threw on every write, and enterprise policies can block
  storage entirely.

`indexedDB.open` can likewise reject or throw depending on browser state. An
unhandled exception here can break an otherwise-healthy code path. This rule
flags these operations when they are not lexically wrapped in a `try` block, and
offers a suggestion to wrap the statement.

A `try` that merely contains a function *definition* does not protect calls made
when that function is later invoked; the rule accounts for this and still
reports writes inside such functions.

## Incorrect

```js
localStorage.setItem("draft", bigString);
const db = indexedDB.open("app-db", 1);
```

## Correct

```js
try {
  localStorage.setItem("draft", bigString);
} catch (error) {
  // Free space, shrink the payload, or notify the user.
}
```

## Options

```jsonc
{
  "storage-security/require-try-catch-storage": [
    "error",
    {
      // Set to false to skip indexedDB.open() checks.
      "checkIndexedDB": true
    }
  ]
}
```

## Further reading

- [How to handle localStorage quota exceeded errors](https://www.browser-storage.com/browser-storage-fundamentals-quotas/understanding-web-storage-apis/how-to-handle-localstorage-quota-exceeded-errors/)
