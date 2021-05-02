/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  env: {
    es6: true,
    node: true,
    es2020: true,
  },
  parserOptions: {
    project: "tsconfig.eslint.json",
    ecmaVersion: 2020,
  },
  plugins: ["@typescript-eslint", "prettier", "simple-import-sort"],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": "allow-with-description",
        "ts-nocheck": false,
        "ts-check": false,
        minimumDescriptionLength: 3,
      },
    ],
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          // Side effect imports.
          ["^\\u0000"],

          // Node.js builtins.
          [`^(node:)?(${require("module").builtinModules.join("|")})(/|$)`],

          // Internal packages.
          [
            `^(@|${Object.keys(require("./tsconfig.json").compilerOptions.paths)
              .map(path => path.slice(0, -2))
              .join("|")})(/.*|$)`,
          ],

          // Namespaced packages.
          ["^@?\\w"],

          // Parent imports. Put `..` last.
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],

          // Other relative imports. Put same-folder imports and `.` last.
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
        ],
      },
    ],
  },
};
