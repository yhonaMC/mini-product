module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  cacheDirectory: '<rootDir>/tmp/jest-cache',
  modulePathIgnorePatterns: ['<rootDir>/tmp/'],
  testPathIgnorePatterns: ['/node_modules/', '/tmp/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|@d11/.*)/)',
  ],
};
