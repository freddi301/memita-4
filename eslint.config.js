// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    plugins: { "@typescript-eslint": typescriptEslint },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
]);
