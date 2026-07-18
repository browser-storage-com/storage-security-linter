/**
 * @fileoverview Advisory rule: warn when values are written to web storage
 * without passing through an approved encryption wrapper.
 */

import {
  getCalleeName,
  getSetItemCall,
  getStorageMemberAssignment,
} from "../utils.js";

const DEFAULT_WRAPPERS = ["encrypt", "secureStore", "seal", "encryptJSON"];

/**
 * Decide whether a value expression is produced by an approved wrapper call,
 * e.g. `encrypt(data)` or `crypto.secureStore(data)`.
 *
 * @param {import('estree').Node | undefined} valueNode - The written value.
 * @param {Set<string>} wrappers - Approved wrapper names.
 * @returns {boolean} True when the value is considered protected.
 */
function isWrapped(valueNode, wrappers) {
  if (!valueNode) {
    return false;
  }
  // Await/wrapping: `await encrypt(x)`.
  let node = valueNode;
  if (node.type === "AwaitExpression" && node.argument) {
    node = node.argument;
  }
  if (node.type !== "CallExpression") {
    return false;
  }
  const name = getCalleeName(node.callee);
  return name !== null && wrappers.has(name);
}

/**
 * Values that are inherently harmless to store (empty removal, booleans,
 * timestamps) generate noise; only object/array/identifier/string writes are
 * worth flagging.
 *
 * @param {import('estree').Node | undefined} valueNode - The written value.
 * @returns {boolean} True when the value is worth an unencrypted-write warning.
 */
function isMeaningfulValue(valueNode) {
  if (!valueNode) {
    return false;
  }
  const t = valueNode.type;
  return (
    t === "Identifier" ||
    t === "ObjectExpression" ||
    t === "ArrayExpression" ||
    t === "MemberExpression" ||
    t === "CallExpression" ||
    t === "AwaitExpression" ||
    (t === "Literal" && typeof valueNode.value === "string" && valueNode.value !== "") ||
    t === "TemplateLiteral"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Encourage routing localStorage/sessionStorage writes through an approved encryption wrapper",
      recommended: false,
      url: "https://www.browser-storage.com/storage-security-encryption-privacy/encrypting-browser-storage-with-web-crypto/",
    },
    schema: [
      {
        type: "object",
        properties: {
          wrappers: {
            type: "array",
            items: { type: "string" },
            description: "Callee names treated as encryption/secure-store wrappers.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unencryptedWrite:
        "Value written to {{storage}} without an approved encryption wrapper ({{wrappers}}). Encrypt sensitive data with the Web Crypto API before persisting it.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const wrapperList =
      Array.isArray(options.wrappers) && options.wrappers.length > 0
        ? options.wrappers
        : DEFAULT_WRAPPERS;
    const wrappers = new Set(wrapperList);

    /**
     * @param {import('estree').Node | undefined} valueNode - Written value.
     * @param {string} storage - Storage name.
     * @param {import('estree').Node} node - Report target.
     */
    function check(valueNode, storage, node) {
      if (!isMeaningfulValue(valueNode)) {
        return;
      }
      if (isWrapped(valueNode, wrappers)) {
        return;
      }
      context.report({
        node,
        messageId: "unencryptedWrite",
        data: { storage, wrappers: wrapperList.join(", ") },
      });
    }

    return {
      CallExpression(node) {
        const call = getSetItemCall(node);
        if (!call) {
          return;
        }
        check(call.valueNode, call.storage, node);
      },
      AssignmentExpression(node) {
        const assign = getStorageMemberAssignment(node);
        if (!assign) {
          return;
        }
        check(assign.valueNode, assign.storage, node);
      },
    };
  },
};

export default rule;
