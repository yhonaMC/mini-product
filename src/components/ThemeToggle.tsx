import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppIcon } from './AppIcon';

export function ThemeToggle() {
  const { colors, isDark, setMode } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      hitSlop={8}
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.primarySoft : colors.background },
      ]}
    >
      <AppIcon name={isDark ? 'sun' : 'moon'} color={colors.text} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
