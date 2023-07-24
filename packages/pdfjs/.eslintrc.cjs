module.exports = {
    root: true,
    env: {
        browser: true
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        parser: '@babel/eslint-parser',
        sourceType: 'module'
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        indent: ['error', 4, {
            SwitchCase: 1
        }],
        'space-before-function-paren': ['error', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always'
        }]
    }
}
