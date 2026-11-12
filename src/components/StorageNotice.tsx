import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../hooks/useFavorites';
import { useTheme } from '../theme/ThemeProvider';

export function StorageNotice() {
  const { storageError, retryPersistence } = useFavorites();
  const { colors } = useTheme();
  if (!storageError) {
    return null;
  }
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: colors.surface }]}
    >
      <Text style={[styles.message, { color: colors.danger }]}>
        {storageError}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar guardar favoritos"
        onPress={retryPersistence}
        style={styles.retry}
      >
        <Text style={{ color: colors.primary }}>Reintentar</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: { flex: 1, fontSize: 13, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: 'center' },
});
