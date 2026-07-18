import test from "node:test";
import { RuleTester } from "eslint";
import rule from "../lib/rules/require-try-catch-storage.js";

RuleTester.describe = (_text, fn) => fn();
RuleTester.it = (text, fn) => test(text, fn);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("require-try-catch-storage", rule, {
  valid: [
    "try { localStorage.setItem('a', b); } catch (e) {}",
    "try { window.sessionStorage.setItem('a', b); } catch (e) { handle(e); }",
    "try { indexedDB.open('db', 1); } catch (e) {}",
    // Non-storage setItem.
    "map.setItem('a', b);",
    // getItem does not throw the same way; not flagged.
    "localStorage.getItem('a');",
    // indexedDB checking disabled.
    {
      code: "indexedDB.open('db');",
      options: [{ checkIndexedDB: false }],
    },
  ],
  invalid: [
    {
      code: "localStorage.setItem('a', b);",
      errors: [
        {
          messageId: "missingTryCatch",
          suggestions: [
            {
              messageId: "wrapInTryCatch",
              output:
                "try {\n  localStorage.setItem('a', b);\n} catch (error) {\n  // TODO: handle storage write failure\n}",
            },
          ],
        },
      ],
    },
    {
      code: "window.localStorage.setItem('a', b);",
      errors: [{ messageId: "missingTryCatch", suggestions: 1 }],
    },
    {
      code: "sessionStorage.setItem('a', b);",
      errors: [{ messageId: "missingTryCatch", suggestions: 1 }],
    },
    {
      code: "indexedDB.open('db', 1);",
      errors: [{ messageId: "missingTryCatch", suggestions: 1 }],
    },
    {
      // A try that only lexically contains the function does not protect the call.
      code: "try { doStuff(); } catch (e) {}\nfunction save() { localStorage.setItem('a', b); }",
      errors: [{ messageId: "missingTryCatch", suggestions: 1 }],
    },
  ],
});
