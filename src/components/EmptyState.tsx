import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={[styles.symbol, { color: colors.primary }]}
        accessibilityElementsHidden
      >
        ◇
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        {title}
      </Text>
      <Text style={[styles.description, { color: colors.secondary }]}>
        {description}
      </Text>
      {onAction && actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  symbol: { fontSize: 54 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
});
