module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    // Allow console for logging in server applications
    'no-console': 'off',
    // Allow unused variables that start with underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // General code quality
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'logs/',
    'coverage/',
    '*.test.js',
    '*.spec.js',
  ],
};
