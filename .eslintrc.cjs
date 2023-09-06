/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'mocha'],
    root: true,
    rules: {
        indent: 0,
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'mocha/no-exclusive-tests': 'error',
        'mocha/no-skipped-tests': 'error',
    },
    ignorePatterns: ['dist'],
};
