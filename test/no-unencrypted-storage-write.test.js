import test from "node:test";
import { RuleTester } from "eslint";
import rule from "../lib/rules/no-unencrypted-storage-write.js";

RuleTester.describe = (_text, fn) => fn();
RuleTester.it = (text, fn) => test(text, fn);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-unencrypted-storage-write", rule, {
  valid: [
    // Wrapped through an approved encryption call.
    "localStorage.setItem('profile', encrypt(profile));",
    "sessionStorage.setItem('data', secureStore(data));",
    "localStorage.setItem('x', await encrypt(x));",
    "localStorage.setItem('x', crypto.encrypt(x));",
    // Non-storage object.
    "store.setItem('data', rawData);",
    // Harmless values are ignored (boolean / number / empty string).
    "localStorage.setItem('flag', true);",
    "localStorage.setItem('n', 42);",
    "localStorage.setItem('empty', '');",
    // Custom wrapper list.
    {
      code: "localStorage.setItem('x', vault(x));",
      options: [{ wrappers: ["vault"] }],
    },
  ],
  invalid: [
    {
      code: "localStorage.setItem('profile', profile);",
      errors: [{ messageId: "unencryptedWrite" }],
    },
    {
      code: "localStorage.setItem('data', { a: 1 });",
      errors: [{ messageId: "unencryptedWrite" }],
    },
    {
      code: "sessionStorage.setItem('token', JSON.stringify(obj));",
      errors: [{ messageId: "unencryptedWrite" }],
    },
    {
      code: "window.localStorage.setItem('x', rawString);",
      errors: [{ messageId: "unencryptedWrite" }],
    },
    {
      code: "localStorage.data = payload;",
      errors: [{ messageId: "unencryptedWrite" }],
    },
    {
      code: "localStorage.setItem('x', encrypt(x));",
      options: [{ wrappers: ["vault"] }],
      errors: [{ messageId: "unencryptedWrite" }],
    },
  ],
});
