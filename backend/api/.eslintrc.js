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
    'plugin:security/recommended',
    'plugin:node/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['security', 'node'],
  rules: {
    // Allow console for logging in server applications
    'no-console': 'off',
    // Allow unused variables that start with underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Security rules
    'security/detect-object-injection': 'off', // Too strict for API responses
    'security/detect-non-literal-fs-filename': 'off', // We use dynamic paths safely
    // Node.js rules
    'node/no-missing-require': 'error',
    'node/no-unpublished-require': 'off', // Allow dev dependencies in development
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
