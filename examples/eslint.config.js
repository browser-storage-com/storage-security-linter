// Flat config example (ESLint 9+).
// From an installed package this import would be:
//   import storageSecurity from "eslint-plugin-storage-security";
import storageSecurity from "eslint-plugin-storage-security";

export default [
  // Option A: use the ready-made flat preset.
  storageSecurity.configs["flat/recommended"],

  // Option B: wire it up manually and tune options.
  {
    files: ["src/**/*.{js,ts,jsx,tsx}"],
    plugins: {
      "storage-security": storageSecurity,
    },
    rules: {
      "storage-security/no-token-in-localstorage": "error",
      "storage-security/no-sensitive-data-in-storage": "error",
      "storage-security/require-try-catch-storage": "error",
      "storage-security/no-json-parse-storage-without-catch": "error",
      // Advisory rule, off in the recommended preset. Enable it and point it
      // at your own encryption wrappers if you keep sensitive data client-side.
      "storage-security/no-unencrypted-storage-write": [
        "warn",
        { wrappers: ["encrypt", "secureStore"] },
      ],
    },
  },
];
