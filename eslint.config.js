// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const pluginLingui = require("eslint-plugin-lingui");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "components/i18n/locales/**/*.js"],
    plugins: { "@typescript-eslint": typescriptEslint },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: "./tsconfig.json" },
    },
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  pluginLingui.configs["flat/recommended"],
]);
