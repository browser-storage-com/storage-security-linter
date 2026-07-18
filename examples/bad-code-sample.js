/* eslint-disable no-undef, no-unused-vars */
/*
 * This file intentionally contains risky browser-storage patterns.
 * Lint it with the recommended preset to see each rule fire:
 *
 *   npx eslint examples/bad-code-sample.js
 */

// --- no-token-in-localstorage -------------------------------------------
// Auth tokens in web storage are readable by any script (XSS = token theft).
localStorage.setItem("authToken", token); // flagged
sessionStorage.setItem("jwt", jwt); // flagged
localStorage.apiKey = apiKey; // flagged (member assignment)
window.localStorage.setItem("refresh_token", rt); // flagged (window-prefixed)

// --- no-sensitive-data-in-storage ---------------------------------------
// PII in web storage is unencrypted and persists across sessions.
localStorage.setItem("ssn", userSsn); // flagged
localStorage.setItem("creditCardNumber", card); // flagged
sessionStorage.setItem("dateOfBirth", dob); // flagged

// --- require-try-catch-storage ------------------------------------------
// setItem can throw QuotaExceededError; indexedDB.open can throw too.
localStorage.setItem("draft", bigString); // flagged (no try/catch)
const db = indexedDB.open("app-db", 1); // flagged (no try/catch)

// Correct: wrapped in try/catch.
try {
  localStorage.setItem("draft", bigString);
} catch (error) {
  // fall back to a smaller payload or notify the user
}

// --- no-json-parse-storage-without-catch --------------------------------
// Corrupt or tampered stored JSON will throw and crash the app.
const settings = JSON.parse(localStorage.getItem("settings")); // flagged

// Correct: guarded parse.
let profile;
try {
  profile = JSON.parse(localStorage.getItem("profile"));
} catch (error) {
  profile = {};
}

// --- no-unencrypted-storage-write (advisory, enable explicitly) ---------
// Writing raw sensitive objects without an encryption wrapper.
localStorage.setItem("profile", profile); // flagged only when rule enabled

// Correct: route through an approved wrapper.
localStorage.setItem("profile", encrypt(profile));

function encrypt(value) {
  return value; // placeholder for a real Web Crypto wrapper
}
