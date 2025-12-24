import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@stylistic": stylistic,
    },
    files: ["eslint.config.mjs", "vite.*.ts", "src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tsPlugin.configs.strict.rules,
      ...tsPlugin.configs.stylistic.rules,
      ...stylistic.configs.recommended.rules,

      "no-undef": "off",

      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-function": "warn",

      "@stylistic/quotes": ["warn", "double"],
      "@stylistic/semi": ["warn", "always"],
      "@stylistic/member-delimiter-style": ["warn", { multiline: { delimiter: "semi" }, singleline: { delimiter: "semi" } }],
      "@stylistic/indent": ["warn", 2],
      "@stylistic/brace-style": ["warn", "1tbs"],
      "@stylistic/arrow-parens": ["warn", "always"],
      "@stylistic/comma-dangle": ["warn", "always-multiline"],
      "@stylistic/jsx-one-expression-per-line": ["warn", { allow: "single-line" }],
      "@stylistic/eol-last": ["warn", "always"],
      "@stylistic/no-trailing-spaces": "warn",

      // Discourage any type usage
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
