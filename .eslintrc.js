module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['node_modules/', 'tmp/', 'android/', 'ios/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
};
