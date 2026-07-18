/**
 * @fileoverview Require write operations that can throw (quota / security
 * errors) to be wrapped in try/catch: `localStorage.setItem` and
 * `indexedDB.open`.
 */

import {
  getSetItemCall,
  getStorageName,
  isWithinTryBlock,
} from "../utils.js";

/**
 * Detect `indexedDB.open(...)` (optionally `window.indexedDB.open(...)`).
 *
 * @param {import('estree').Node} node - CallExpression node.
 * @returns {boolean} True for an indexedDB.open call.
 */
function isIndexedDbOpen(node) {
  if (node.type !== "CallExpression") {
    return false;
  }
  const callee = node.callee;
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier" ||
    callee.property.name !== "open"
  ) {
    return false;
  }
  return getStorageName(callee.object, new Set(["indexedDB"])) !== null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require storage writes that can throw (quota/security errors) to be wrapped in try/catch",
      recommended: true,
      url: "https://www.browser-storage.com/browser-storage-fundamentals-quotas/understanding-web-storage-apis/how-to-handle-localstorage-quota-exceeded-errors/",
    },
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: {
          checkIndexedDB: {
            type: "boolean",
            description: "Also require try/catch around indexedDB.open().",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTryCatch:
        "{{operation}} can throw (e.g. QuotaExceededError or a SecurityError in private mode). Wrap it in try/catch and handle the failure.",
      wrapInTryCatch: "Wrap this statement in a try/catch block.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const checkIndexedDB = options.checkIndexedDB !== false;
    const sourceCode = context.sourceCode || context.getSourceCode();

    /**
     * @param {import('estree').Node} node - Node to report.
     * @param {string} operation - Human label for the operation.
     */
    function report(node, operation) {
      if (isWithinTryBlock(node)) {
        return;
      }
      context.report({
        node,
        messageId: "missingTryCatch",
        data: { operation },
        suggest: [
          {
            messageId: "wrapInTryCatch",
            fix(fixer) {
              // Find the nearest enclosing statement/declaration to wrap.
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
                `try {\n  ${indented}\n} catch (error) {\n  // TODO: handle storage write failure\n}`,
              );
            },
          },
        ],
      });
    }

    return {
      CallExpression(node) {
        const call = getSetItemCall(node);
        if (call) {
          report(node, `${call.storage}.setItem()`);
          return;
        }
        if (checkIndexedDB && isIndexedDbOpen(node)) {
          report(node, "indexedDB.open()");
        }
      },
    };
  },
};

export default rule;
