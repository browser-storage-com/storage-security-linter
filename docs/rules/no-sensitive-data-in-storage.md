# no-sensitive-data-in-storage

Disallow writing likely personally identifiable information (PII) or other
sensitive personal data to `localStorage` / `sessionStorage`.

## Rule details

Beyond credentials, browser storage is a poor home for personal data: it is
stored unencrypted on disk, persists across sessions (for `localStorage`), is
readable by any script on the origin, and may outlive the user's expectation of
privacy. Storing regulated data such as social-security numbers, card details,
or health information can also create compliance exposure.

This rule flags writes whose **key** matches a list of PII-like substrings
(case-insensitive), across `setItem` calls and direct member assignments.

## Incorrect

```js
localStorage.setItem("ssn", userSsn);
localStorage.setItem("creditCardNumber", card);
sessionStorage.setItem("dateOfBirth", dob);
localStorage.passport = passportNumber;
```

## Correct

```js
// Keep PII server-side and store only an opaque reference client-side.
localStorage.setItem("profileRef", profileId);

// If data must live client-side, encrypt it first (see the Web Crypto guide).
localStorage.setItem("profile", await encrypt(profile));
```

## Options

```jsonc
{
  "storage-security/no-sensitive-data-in-storage": [
    "error",
    {
      // Replace the built-in PII patterns entirely.
      "patterns": ["ssn", "creditCard", "cvv", "dob"],
      // Or keep the defaults and add your own.
      "additionalPatterns": ["employeeId", "salary"]
    }
  ]
}
```

## Further reading

- [Storage partitioning and privacy controls](https://www.browser-storage.com/storage-security-encryption-privacy/storage-partitioning-and-privacy-controls/)
- [Encrypting browser storage with Web Crypto](https://www.browser-storage.com/storage-security-encryption-privacy/encrypting-browser-storage-with-web-crypto/)
