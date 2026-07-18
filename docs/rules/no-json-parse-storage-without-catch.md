# no-json-parse-storage-without-catch

Require error handling around `JSON.parse` of values read from web storage.

## Rule details

`JSON.parse(localStorage.getItem(key))` is one of the most common browser-storage
patterns — and one of the most fragile. The stored string can be:

- `null` when the key is absent (`JSON.parse(null)` yields `null` rather than
  throwing, but downstream code often assumes an object),
- truncated or corrupted by a failed earlier write,
- tampered with by the user or another script.

Any of these throws a `SyntaxError` that, if unhandled, can crash the surrounding
feature on startup. This rule flags `JSON.parse` applied directly to a web-storage
`getItem(...)` read when it is not wrapped in a `try` block, and offers a
suggestion to wrap it.

## Incorrect

```js
const settings = JSON.parse(localStorage.getItem("settings"));
```

## Correct

```js
let settings;
try {
  settings = JSON.parse(localStorage.getItem("settings")) ?? {};
} catch (error) {
  settings = {}; // fall back to defaults on corrupt data
}
```

## Options

This rule has no options.

## Further reading

- [Data serialization and deserialization](https://www.browser-storage.com/browser-storage-fundamentals-quotas/data-serialization-deserialization/)
