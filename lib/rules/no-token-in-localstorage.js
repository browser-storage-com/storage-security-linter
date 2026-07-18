/**
 * @fileoverview Flag storing auth tokens / JWTs / secrets in web storage.
 */

import {
  getSetItemCall,
  getStaticString,
  getStorageMemberAssignment,
  matchKeyPattern,
} from "../utils.js";

const DEFAULT_PATTERNS = [
  "token",
  "jwt",
  "auth",
  "secret",
  "password",
  "passwd",
  "apikey",
  "api_key",
  "accesskey",
  "access_token",
  "refresh_token",
  "bearer",
  "credential",
  "session",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow storing authentication tokens, JWTs, or secrets in localStorage/sessionStorage",
      recommended: true,
      url: "https://www.browser-storage.com/storage-security-encryption-privacy/securing-auth-tokens-in-browser-storage/",
    },
    schema: [
      {
        type: "object",
        properties: {
          patterns: {
            type: "array",
            items: { type: "string" },
            description: "Case-insensitive substrings that mark a key as sensitive.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tokenInStorage:
        "Avoid storing '{{key}}' in {{storage}}: web storage is readable by any script, so an XSS flaw leaks the token. Keep auth tokens in memory or an HttpOnly, Secure cookie.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const patterns =
      Array.isArray(options.patterns) && options.patterns.length > 0
        ? options.patterns
        : DEFAULT_PATTERNS;

    /**
     * @param {string} key - Storage key.
     * @param {string} storage - Storage object name.
     * @param {import('estree').Node} node - Node to report on.
     */
    function check(key, storage, node) {
      if (matchKeyPattern(key, patterns)) {
        context.report({
          node,
          messageId: "tokenInStorage",
          data: { key, storage },
        });
      }
    }

    return {
      CallExpression(node) {
        const call = getSetItemCall(node);
        if (!call || !call.keyNode) {
          return;
        }
        check(getStaticString(call.keyNode), call.storage, node);
      },
      AssignmentExpression(node) {
        const assign = getStorageMemberAssignment(node);
        if (!assign) {
          return;
        }
        check(assign.key, assign.storage, node);
      },
    };
  },
};

export default rule;
