module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*",
    "/node_modules/**/*",
    "jest.config.js",
    ".eslintrc.js",
  ],
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "no-trailing-spaces": "error",
    "eol-last": "error",
    "max-len": ["warn", { "code": 120 }],
  },
};
