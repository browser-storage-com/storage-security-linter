/**
 * @fileoverview Flag `JSON.parse(localStorage.getItem(...))` that is not
 * protected against corrupt / malformed stored data.
 */

import { isGetItemCall, isWithinTryBlock } from "../utils.js";

/**
 * Is this callee `JSON.parse` (optionally `window.JSON.parse`)?
 *
 * @param {import('estree').Node} callee - Callee node.
 * @returns {boolean} True for JSON.parse.
 */
function isJsonParse(callee) {
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier" ||
    callee.property.name !== "parse"
  ) {
    return false;
  }
  const obj = callee.object;
  if (obj.type === "Identifier" && obj.name === "JSON") {
    return true;
  }
  return (
    obj.type === "MemberExpression" &&
    !obj.computed &&
    obj.property.type === "Identifier" &&
    obj.property.name === "JSON"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require error handling around JSON.parse of values read from web storage",
      recommended: true,
      url: "https://www.browser-storage.com/browser-storage-fundamentals-quotas/data-serialization-deserialization/",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      unguardedParse:
        "JSON.parse() on a {{storage}} value can throw on corrupt or tampered data and crash your app. Wrap it in try/catch or validate before parsing.",
      wrapInTryCatch: "Wrap this JSON.parse in try/catch.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      CallExpression(node) {
        if (!isJsonParse(node.callee)) {
          return;
        }
        const arg = node.arguments[0];
        if (!isGetItemCall(arg)) {
          return;
        }
        if (isWithinTryBlock(node)) {
          return;
        }
        const callee = arg.callee;
        const storage =
          callee.object.type === "Identifier"
            ? callee.object.name
            : "storage";

        context.report({
          node,
          messageId: "unguardedParse",
          data: { storage },
          suggest: [
            {
              messageId: "wrapInTryCatch",
              fix(fixer) {
                let target = node;
                while (
                  target &&
                  !target.type.endsWith("Statement") &&
                  !target.type.endsWith("Declaration")
                ) {
                  target = target.parent;
                }
                if (!target) {
                  return null;
                }
                const text = sourceCode.getText(target);
                const indented = text
                  .split("\n")
                  .map((line, i) => (i === 0 ? line : "  " + line))
                  .join("\n");
                return fixer.replaceText(
                  target,
                  `try {\n  ${indented}\n} catch (error) {\n  // TODO: handle corrupt stored data\n}`,
                );
              },
            },
          ],
        });
      },
    };
  },
};

export default rule;
