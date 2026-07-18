import test from "node:test";
import { RuleTester } from "eslint";
import rule from "../lib/rules/no-sensitive-data-in-storage.js";

RuleTester.describe = (_text, fn) => fn();
RuleTester.it = (text, fn) => test(text, fn);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-sensitive-data-in-storage", rule, {
  valid: [
    "localStorage.setItem('theme', 'dark');",
    "localStorage.setItem('lastVisited', ts);",
    "sessionStorage.setItem('cartCount', '2');",
    "analytics.setItem('ssn', value);",
    "localStorage.setItem(computedKey, value);",
    {
      code: "localStorage.setItem('nickname', n);",
      options: [{ patterns: ["ssn"] }],
    },
  ],
  invalid: [
    {
      code: "localStorage.setItem('ssn', ssn);",
      errors: [{ messageId: "sensitiveData" }],
    },
    {
      code: "localStorage.setItem('creditCardNumber', cc);",
      errors: [{ messageId: "sensitiveData" }],
    },
    {
      code: "sessionStorage.setItem('cvv', cvv);",
      errors: [{ messageId: "sensitiveData" }],
    },
    {
      code: "window.localStorage.setItem('dateOfBirth', dob);",
      errors: [{ messageId: "sensitiveData" }],
    },
    {
      code: "localStorage.passport = p;",
      errors: [{ messageId: "sensitiveData" }],
    },
    {
      code: "localStorage.setItem('employeeId', id);",
      options: [{ additionalPatterns: ["employeeId"] }],
      errors: [{ messageId: "sensitiveData" }],
    },
  ],
});
