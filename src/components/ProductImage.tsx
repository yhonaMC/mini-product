import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface Props {
  uri: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  actionLabel?: string;
}

export function ProductImage(props: Props) {
  // A different URI gets its own error/retry state, including in recycled rows.
  return <RetryableImage key={props.uri} {...props} />;
}

function RetryableImage({
  uri,
  accessibilityLabel,
  style,
  onPress,
  actionLabel,
}: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const image = (
    <FastImage
      key={attempt}
      accessible={!onPress}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      source={{ uri, cache: FastImage.cacheControl.immutable }}
      resizeMode={FastImage.resizeMode.contain}
      onError={() => setFailed(true)}
      style={StyleSheet.absoluteFill}
    />
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }, style]}
    >
      {failed ? (
        <View style={styles.error}>
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.message, { color: colors.secondary }]}
          >
            No se pudo cargar la imagen.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reintentar imagen: ${accessibilityLabel}`}
            onPress={() => {
              // A fresh native view retries even when the URI did not change.
              setAttempt(current => current + 1);
              setFailed(false);
            }}
            style={[styles.retry, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryLabel, { color: colors.onPrimary }]}>
              Reintentar imagen
            </Text>
          </Pressable>
        </View>
      ) : onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? accessibilityLabel}
          onPress={onPress}
          style={StyleSheet.absoluteFill}
        >
          {image}
        </Pressable>
      ) : (
        image
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  message: { textAlign: 'center', fontSize: 14 },
  retry: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  retryLabel: { fontWeight: '700', textAlign: 'center' },
});
