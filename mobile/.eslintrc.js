// ESLint 8 legacy config (https://docs.expo.dev/guides/using-eslint/).
module.exports = {
  root: true,
  extends: 'expo',
  ignorePatterns: ['/dist/*', '/.expo/*', '/node_modules/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
  overrides: [
    {
      // The shared enums declare a const and a type with the same name on purpose (byte-identical
      // copy of api/src/common/shared).
      files: ['src/shared/**/*.ts'],
      rules: { '@typescript-eslint/no-redeclare': 'off' },
    },
  ],
};
