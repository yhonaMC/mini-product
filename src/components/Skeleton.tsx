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
      accessible
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
          <View
            style={[
              styles.image,
              detail && styles.detailImage,
              { backgroundColor: colors.skeleton },
            ]}
          />
          <View style={styles.info}>
            <View style={[styles.line, { backgroundColor: colors.skeleton }]} />
            <View
              style={[styles.shortLine, { backgroundColor: colors.skeleton }]}
            />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: {
    padding: 12,
    borderRadius: 16,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detail: {
    minHeight: 400,
    flexDirection: 'column',
    alignItems: 'stretch',
    margin: 20,
  },
  image: { width: 112, height: 160, borderRadius: 10 },
  detailImage: { width: '100%', height: 300 },
  info: { flex: 1, gap: 16 },
  line: { height: 18, width: '80%', borderRadius: 6 },
  shortLine: { height: 16, width: '45%', borderRadius: 6 },
});
