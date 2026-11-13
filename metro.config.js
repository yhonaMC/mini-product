const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('node:path');

const temporaryDirectoryPattern = path
  .resolve(__dirname, 'tmp')
  .replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Leave memory for the Android emulator and native builds on the 16 GB host.
  maxWorkers: 2,
  resolver: {
    blockList: [
      new RegExp(
        '^' + temporaryDirectoryPattern + '[/\\\\]',
        process.platform === 'win32' ? 'i' : undefined,
      ),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
