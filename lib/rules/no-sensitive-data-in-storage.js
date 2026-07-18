/**
 * @fileoverview Flag likely PII / sensitive data written to web storage.
 */

import {
  getSetItemCall,
  getStaticString,
  getStorageMemberAssignment,
  matchKeyPattern,
} from "../utils.js";

const DEFAULT_PATTERNS = [
  "ssn",
  "socialsecurity",
  "social_security",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
  "cardnum",
  "cvv",
  "cvc",
  "dob",
  "dateofbirth",
  "date_of_birth",
  "birthdate",
  "passport",
  "driverlicense",
  "driver_license",
  "taxid",
  "tax_id",
  "bankaccount",
  "bank_account",
  "iban",
  "medicalrecord",
  "healthrecord",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow writing likely PII or other sensitive personal data to localStorage/sessionStorage",
      recommended: true,
      url: "https://www.browser-storage.com/storage-security-encryption-privacy/storage-partitioning-and-privacy-controls/",
    },
    schema: [
      {
        type: "object",
        properties: {
          patterns: {
            type: "array",
            items: { type: "string" },
            description: "Case-insensitive substrings that mark a key as sensitive PII.",
          },
          additionalPatterns: {
            type: "array",
            items: { type: "string" },
            description: "Extra patterns appended to the defaults.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      sensitiveData:
        "Avoid writing '{{key}}' to {{storage}}: PII in web storage is unencrypted, persists across sessions, and is exposed to any script. Store it server-side or encrypt before writing.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const base =
      Array.isArray(options.patterns) && options.patterns.length > 0
        ? options.patterns
        : DEFAULT_PATTERNS;
    const patterns = Array.isArray(options.additionalPatterns)
      ? base.concat(options.additionalPatterns)
      : base;

    /**
     * @param {string | null} key - Storage key.
     * @param {string} storage - Storage name.
     * @param {import('estree').Node} node - Node to report.
     */
    function check(key, storage, node) {
      if (matchKeyPattern(key, patterns)) {
        context.report({
          node,
          messageId: "sensitiveData",
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
