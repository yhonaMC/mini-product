const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Leave memory for the Android emulator and native builds on the 16 GB host.
  maxWorkers: 2,
  resolver: { blockList: [/[/\\]tmp[/\\].*/] },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
