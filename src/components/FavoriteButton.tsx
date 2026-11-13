import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Product } from '../domain/product';
import { useFavoritesActions, useIsFavorite } from '../hooks/useFavorites';
import { useTheme } from '../theme/ThemeProvider';

export function FavoriteButton({
  product,
  animated = false,
}: {
  product: Product;
  animated?: boolean;
}) {
  const { colors } = useTheme();
  const selected = useIsFavorite(product.id);
  const { toggleFavorite } = useFavoritesActions();
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${selected ? 'Quitar' : 'Añadir'} ${product.title} ${
        selected ? 'de' : 'a'
      } favoritos`}
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={() => {
        if (animated && !reducedMotion) {
          scale.value = withSequence(
            withTiming(1.25, { duration: 120 }),
            withSpring(1, { damping: 8 }),
          );
        }
        toggleFavorite(product);
      }}
      style={[styles.button, { backgroundColor: colors.surface }]}
    >
      <Animated.View style={animatedStyle}>
        <Text
          style={[
            styles.heart,
            { color: selected ? colors.danger : colors.secondary },
          ]}
        >
          {selected ? '\u2665\uFE0E' : '♡'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  heart: { fontSize: 30, lineHeight: 36 },
});
