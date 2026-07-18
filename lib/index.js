/**
 * @fileoverview eslint-plugin-storage-security
 * Flags risky browser-storage usage and suggests safer patterns.
 */

import noTokenInLocalstorage from "./rules/no-token-in-localstorage.js";
import noSensitiveDataInStorage from "./rules/no-sensitive-data-in-storage.js";
import noUnencryptedStorageWrite from "./rules/no-unencrypted-storage-write.js";
import requireTryCatchStorage from "./rules/require-try-catch-storage.js";
import noJsonParseStorageWithoutCatch from "./rules/no-json-parse-storage-without-catch.js";

const PLUGIN_NAME = "storage-security";

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
const rules = {
  "no-token-in-localstorage": noTokenInLocalstorage,
  "no-sensitive-data-in-storage": noSensitiveDataInStorage,
  "no-unencrypted-storage-write": noUnencryptedStorageWrite,
  "require-try-catch-storage": requireTryCatchStorage,
  "no-json-parse-storage-without-catch": noJsonParseStorageWithoutCatch,
};

/**
 * Build a `{ 'storage-security/<rule>': severity }` map.
 *
 * @param {'error' | 'warn'} severity - Severity to assign.
 * @param {(name: string) => boolean} [filter] - Include predicate.
 * @returns {Record<string, string>} Rule config map.
 */
function buildRuleMap(severity, filter = () => true) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const name of Object.keys(rules)) {
    if (filter(name)) {
      map[`${PLUGIN_NAME}/${name}`] = severity;
    }
  }
  return map;
}

// Rules enabled in the "recommended" preset. The advisory
// no-unencrypted-storage-write rule is intentionally left off.
const recommendedFilter = (name) => name !== "no-unencrypted-storage-write";

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: "eslint-plugin-storage-security",
    version: "0.1.0",
  },
  rules,
  // Populated below (needs a reference to `plugin` for flat configs).
  configs: {},
};

// Legacy (.eslintrc) shareable configs.
const legacyRecommended = {
  plugins: [PLUGIN_NAME],
  rules: buildRuleMap("error", recommendedFilter),
};

const legacyAll = {
  plugins: [PLUGIN_NAME],
  rules: buildRuleMap("error"),
};

// Flat (ESLint 9) shareable configs.
const flatRecommended = {
  plugins: { [PLUGIN_NAME]: plugin },
  rules: buildRuleMap("error", recommendedFilter),
};

const flatAll = {
  plugins: { [PLUGIN_NAME]: plugin },
  rules: buildRuleMap("error"),
};

plugin.configs = {
  recommended: legacyRecommended,
  all: legacyAll,
  "flat/recommended": flatRecommended,
  "flat/all": flatAll,
};

export default plugin;

// Named exports for direct/ergonomic access.
export { rules, plugin };
export const configs = plugin.configs;
export const meta = plugin.meta;
