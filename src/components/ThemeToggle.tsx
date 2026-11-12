import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function ThemeToggle() {
  const { colors, isDark, setMode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      hitSlop={8}
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      style={styles.button}
    >
      <Text style={[styles.label, { color: colors.primary }]}>
        {isDark ? 'Claro' : 'Oscuro'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
});
