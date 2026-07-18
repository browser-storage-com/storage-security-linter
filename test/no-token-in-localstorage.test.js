import test from "node:test";
import { RuleTester } from "eslint";
import rule from "../lib/rules/no-token-in-localstorage.js";

RuleTester.describe = (_text, fn) => fn();
RuleTester.it = (text, fn) => test(text, fn);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-token-in-localstorage", rule, {
  valid: [
    "localStorage.setItem('theme', 'dark');",
    "localStorage.setItem('locale', 'en-US');",
    "sessionStorage.setItem('scrollPos', '120');",
    "localStorage.count = 3;",
    // setItem on an unrelated object must not fire.
    "myMap.setItem('token', value);",
    "cache.setItem('authInfo', data);",
    // Non-static keys are not matched.
    "localStorage.setItem(dynamicKey, token);",
    // Custom patterns override defaults.
    {
      code: "localStorage.setItem('token', t);",
      options: [{ patterns: ["sessionId"] }],
    },
  ],
  invalid: [
    {
      code: "localStorage.setItem('authToken', token);",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "localStorage.setItem('jwt', value);",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "sessionStorage.setItem('user_password', pw);",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "window.localStorage.setItem('API_KEY', k);",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "localStorage.token = token;",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "globalThis.sessionStorage['refresh_token'] = rt;",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "localStorage.setItem(`access_token`, at);",
      errors: [{ messageId: "tokenInStorage" }],
    },
    {
      code: "localStorage.setItem('sessionId', s);",
      options: [{ patterns: ["sessionId"] }],
      errors: [{ messageId: "tokenInStorage" }],
    },
  ],
});
