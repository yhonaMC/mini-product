import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../theme/ThemeProvider';

/** Replaced by functional screens in Fase 2, after the foundations platform gate. */
export function DetailPlaceholder() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <EmptyState
        title="Encuentra tu próximo favorito"
        description="Elige un producto del catálogo para conocer todos sus detalles."
      />
    </View>
  );
}

export function FavoritesPlaceholder() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <EmptyState
        title="Tu selección, a mano"
        description="Los productos que guardes estarán disponibles aquí, incluso sin conexión."
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
