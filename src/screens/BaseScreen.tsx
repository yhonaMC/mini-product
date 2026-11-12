import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

/** Temporary Fase 0 screen. Functional screens start after the platform gates. */
export function BaseScreen() {
  const { colors, isDark, setMode } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          TU PRÓXIMO FAVORITO
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          MiniTienda
        </Text>
        <Text style={[styles.body, { color: colors.secondary }]}>
          Estamos preparando un lugar para descubrir y guardar lo que te gusta.
        </Text>
        <Text style={[styles.body, { color: colors.secondary }]}>
          Apariencia: {isDark ? 'oscura' : 'clara'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isDark ? 'Activar modo claro' : 'Activar modo oscuro'
          }
          onPress={() => setMode(isDark ? 'light' : 'dark')}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
            {isDark ? 'Usar modo claro' : 'Usar modo oscuro'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.lg, borderRadius: 24, gap: spacing.md },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 38, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 25 },
  button: {
    minHeight: 48,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
});
