import test from "node:test";
import { RuleTester } from "eslint";
import rule from "../lib/rules/no-json-parse-storage-without-catch.js";

RuleTester.describe = (_text, fn) => fn();
RuleTester.it = (text, fn) => test(text, fn);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-json-parse-storage-without-catch", rule, {
  valid: [
    "try { JSON.parse(localStorage.getItem('a')); } catch (e) {}",
    "try { const x = JSON.parse(sessionStorage.getItem('a')); } catch (e) { fallback(); }",
    // Not parsing a storage read.
    "JSON.parse(someString);",
    "JSON.parse(response.body);",
    // Storage read without JSON.parse.
    "const raw = localStorage.getItem('a');",
    // getItem on unrelated object.
    "JSON.parse(cache.getItem('a'));",
  ],
  invalid: [
    {
      code: "const data = JSON.parse(localStorage.getItem('a'));",
      errors: [
        {
          messageId: "unguardedParse",
          suggestions: [
            {
              messageId: "wrapInTryCatch",
              output:
                "try {\n  const data = JSON.parse(localStorage.getItem('a'));\n} catch (error) {\n  // TODO: handle corrupt stored data\n}",
            },
          ],
        },
      ],
    },
    {
      code: "JSON.parse(sessionStorage.getItem('user'));",
      errors: [{ messageId: "unguardedParse", suggestions: 1 }],
    },
    {
      code: "JSON.parse(window.localStorage.getItem('user'));",
      errors: [{ messageId: "unguardedParse", suggestions: 1 }],
    },
    {
      code: "function load() { return JSON.parse(localStorage.getItem('a')); }",
      errors: [{ messageId: "unguardedParse", suggestions: 1 }],
    },
  ],
});
