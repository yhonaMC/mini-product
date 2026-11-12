import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

export function Skeleton({ detail = false }: { detail?: boolean }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    opacity.value = reducedMotion
      ? 1
      : withRepeat(withTiming(1, { duration: 900 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando productos"
      style={[styles.container, animatedStyle]}
    >
      {Array.from({ length: detail ? 1 : 4 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            detail && styles.detail,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={[styles.image, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.line, { backgroundColor: colors.skeleton }]} />
          <View
            style={[styles.shortLine, { backgroundColor: colors.skeleton }]}
          />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { padding: 16, borderRadius: 20, gap: 12 },
  detail: { minHeight: 400 },
  image: { height: 120, borderRadius: 12 },
  line: { height: 18, width: '80%', borderRadius: 6 },
  shortLine: { height: 16, width: '45%', borderRadius: 6 },
});
