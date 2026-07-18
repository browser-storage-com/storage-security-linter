/**
 * @fileoverview Shared AST helpers for storage-security rules.
 */

/** Names of the Web Storage globals this plugin cares about. */
export const STORAGE_OBJECTS = new Set(["localStorage", "sessionStorage"]);

/** Global scope holders that may prefix a storage object (window.localStorage, etc.). */
const GLOBAL_HOLDERS = new Set(["window", "globalThis", "self", "top", "parent"]);

/**
 * Read a static string value from a node (string Literal or expression-free TemplateLiteral).
 *
 * @param {import('estree').Node | null | undefined} node - The node to inspect.
 * @returns {string | null} The string value, or null when it is not statically known.
 */
export function getStaticString(node) {
  if (!node) {
    return null;
  }
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (
    node.type === "TemplateLiteral" &&
    node.expressions.length === 0 &&
    node.quasis.length === 1
  ) {
    return node.quasis[0].value.cooked;
  }
  return null;
}

/**
 * Resolve the identifier name of a callee/expression, unwrapping a single
 * global holder (e.g. `window.encrypt` -> `encrypt`).
 *
 * @param {import('estree').Node | null | undefined} node - Callee node.
 * @returns {string | null} The simple name, or null.
 */
export function getCalleeName(node) {
  if (!node) {
    return null;
  }
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "MemberExpression" && !node.computed) {
    // For a.b.c we care about the final property name (the invoked method).
    if (node.property.type === "Identifier") {
      return node.property.name;
    }
  }
  return null;
}

/**
 * Determine whether a node refers to a Web Storage object
 * (`localStorage` / `sessionStorage`), optionally namespaced under a global
 * holder such as `window.localStorage` or `globalThis.sessionStorage`.
 *
 * @param {import('estree').Node | null | undefined} node - The object node.
 * @param {Set<string>} [names] - Which storage names to accept.
 * @returns {string | null} The matched storage name, or null.
 */
export function getStorageName(node, names = STORAGE_OBJECTS) {
  if (!node) {
    return null;
  }
  if (node.type === "Identifier" && names.has(node.name)) {
    return node.name;
  }
  if (node.type === "MemberExpression" && !node.computed) {
    const { object, property } = node;
    if (
      property.type === "Identifier" &&
      names.has(property.name) &&
      object.type === "Identifier" &&
      GLOBAL_HOLDERS.has(object.name)
    ) {
      return property.name;
    }
  }
  return null;
}

/**
 * Detect a `storage.setItem(key, value)` call and return its parts.
 *
 * @param {import('estree').Node} node - A CallExpression node.
 * @param {Set<string>} [names] - Which storage names to accept.
 * @returns {{ storage: string, keyNode: import('estree').Node | undefined, valueNode: import('estree').Node | undefined } | null}
 */
export function getSetItemCall(node, names = STORAGE_OBJECTS) {
  if (node.type !== "CallExpression") {
    return null;
  }
  const callee = node.callee;
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier" ||
    callee.property.name !== "setItem"
  ) {
    return null;
  }
  const storage = getStorageName(callee.object, names);
  if (!storage) {
    return null;
  }
  return {
    storage,
    keyNode: node.arguments[0],
    valueNode: node.arguments[1],
  };
}

/**
 * Detect a `storage.getItem(key)` call.
 *
 * @param {import('estree').Node | null | undefined} node - Node to inspect.
 * @param {Set<string>} [names] - Which storage names to accept.
 * @returns {boolean} True when node is a Web Storage `getItem` call.
 */
export function isGetItemCall(node, names = STORAGE_OBJECTS) {
  if (!node || node.type !== "CallExpression") {
    return false;
  }
  const callee = node.callee;
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "getItem" &&
    getStorageName(callee.object, names) !== null
  );
}

/**
 * Detect a direct member write to a storage object, e.g.
 * `localStorage.token = x` or `window.sessionStorage['jwt'] = x`.
 *
 * @param {import('estree').Node} node - An AssignmentExpression node.
 * @param {Set<string>} [names] - Which storage names to accept.
 * @returns {{ storage: string, key: string | null, keyNode: import('estree').Node, valueNode: import('estree').Node } | null}
 */
export function getStorageMemberAssignment(node, names = STORAGE_OBJECTS) {
  if (node.type !== "AssignmentExpression" || node.operator !== "=") {
    return null;
  }
  const target = node.left;
  if (target.type !== "MemberExpression") {
    return null;
  }
  const storage = getStorageName(target.object, names);
  if (!storage) {
    return null;
  }
  // Ignore reserved storage methods/props being reassigned is out of scope;
  // any bespoke property write is treated as a storage write.
  let key = null;
  let keyNode = target.property;
  if (!target.computed && target.property.type === "Identifier") {
    // Skip the built-in accessor methods themselves.
    if (
      target.property.name === "setItem" ||
      target.property.name === "getItem" ||
      target.property.name === "removeItem" ||
      target.property.name === "clear"
    ) {
      return null;
    }
    key = target.property.name;
  } else if (target.computed) {
    key = getStaticString(target.property);
  }
  return { storage, key, keyNode, valueNode: node.right };
}

/**
 * Walk up the AST via parent pointers to decide whether `node` executes inside
 * the protected `block` of a surrounding `try` statement. Stops at function
 * boundaries because a `try` that lexically contains a function definition does
 * not catch errors thrown when that function is later invoked.
 *
 * @param {import('estree').Node} node - Starting node.
 * @returns {boolean} True when guarded by a try block.
 */
export function isWithinTryBlock(node) {
  let current = node;
  let parent = node.parent;
  while (parent) {
    if (parent.type === "TryStatement" && parent.block === current) {
      return true;
    }
    if (isFunctionNode(parent)) {
      return false;
    }
    current = parent;
    parent = parent.parent;
  }
  return false;
}

/**
 * @param {import('estree').Node} node - Node to test.
 * @returns {boolean} True for function-like nodes.
 */
export function isFunctionNode(node) {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

/**
 * Case-insensitive check: does `key` contain any of `patterns` as a substring?
 *
 * @param {string | null} key - The storage key.
 * @param {string[]} patterns - Lower-cased-or-not patterns to match.
 * @returns {string | null} The first matching pattern, or null.
 */
export function matchKeyPattern(key, patterns) {
  if (typeof key !== "string") {
    return null;
  }
  const haystack = key.toLowerCase();
  for (const pattern of patterns) {
    if (typeof pattern === "string" && haystack.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }
  return null;
}
