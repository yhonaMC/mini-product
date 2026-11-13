import React from 'react';
import { Image } from 'react-native';

const icons = {
  search: require('../assets/icons/search.png'),
  close: require('../assets/icons/close.png'),
  grid: require('../assets/icons/grid.png'),
  detail: require('../assets/icons/detail.png'),
  heart: require('../assets/icons/heart.png'),
  'heart-filled': require('../assets/icons/heart-filled.png'),
  moon: require('../assets/icons/moon.png'),
  sun: require('../assets/icons/sun.png'),
  star: require('../assets/icons/star.png'),
  'star-filled': require('../assets/icons/star-filled.png'),
  bag: require('../assets/icons/bag.png'),
  warning: require('../assets/icons/warning.png'),
};

export type IconName = keyof typeof icons;

export function AppIcon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <Image
      source={icons[name]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}
