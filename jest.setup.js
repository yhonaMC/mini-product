require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Reanimated 3's official mock does not implement the reduced-motion hook.
  useReducedMotion: jest.fn(() => false),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Mock the image boundary, keeping product, hook and store behavior real.
jest.mock('@d11/react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  const FastImage = React.forwardRef((props, ref) =>
    React.createElement(Image, { ...props, ref }),
  );
  FastImage.displayName = 'MockFastImage';
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
  };
  FastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
  return { __esModule: true, default: FastImage };
});
