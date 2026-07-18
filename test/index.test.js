import test from "node:test";
import assert from "node:assert/strict";
import plugin, { configs, meta, rules } from "../lib/index.js";

const RULE_NAMES = [
  "no-token-in-localstorage",
  "no-sensitive-data-in-storage",
  "no-unencrypted-storage-write",
  "require-try-catch-storage",
  "no-json-parse-storage-without-catch",
];

test("exposes all rules with well-formed meta", () => {
  for (const name of RULE_NAMES) {
    const rule = plugin.rules[name];
    assert.ok(rule, `missing rule ${name}`);
    assert.ok(rule.meta, `rule ${name} missing meta`);
    assert.ok(rule.meta.docs.description, `rule ${name} missing description`);
    assert.match(
      rule.meta.docs.url,
      /^https:\/\/www\.browser-storage\.com\//,
      `rule ${name} missing/invalid docs.url`,
    );
    assert.ok(rule.meta.messages, `rule ${name} missing messages`);
    assert.equal(typeof rule.create, "function");
  }
  assert.deepEqual(Object.keys(rules).sort(), [...RULE_NAMES].sort());
});

test("plugin meta names the package and version", () => {
  assert.equal(meta.name, "eslint-plugin-storage-security");
  assert.equal(meta.version, "0.1.0");
});

test("provides legacy and flat configs", () => {
  for (const key of ["recommended", "all", "flat/recommended", "flat/all"]) {
    assert.ok(configs[key], `missing config ${key}`);
    assert.ok(configs[key].rules, `config ${key} missing rules`);
  }
});

test("recommended excludes the advisory unencrypted-write rule", () => {
  assert.ok(
    !("storage-security/no-unencrypted-storage-write" in configs.recommended.rules),
    "recommended should not enable no-unencrypted-storage-write",
  );
  assert.ok(
    "storage-security/no-unencrypted-storage-write" in configs.all.rules,
    "all should enable no-unencrypted-storage-write",
  );
});

test("flat recommended references the plugin object", () => {
  assert.equal(
    configs["flat/recommended"].plugins["storage-security"],
    plugin,
  );
});

test("legacy recommended references the plugin by name string", () => {
  assert.deepEqual(configs.recommended.plugins, ["storage-security"]);
});
