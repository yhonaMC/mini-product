import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const stars = [1, 2, 3, 4, 5];

export function RatingStars({ rating }: { rating: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Calificación ${rating.toFixed(1)} de 5 estrellas`}
      style={styles.row}
    >
      <Text style={[styles.stars, { color: colors.primary }]}>
        {stars.map(star => (star <= Math.round(rating) ? '★' : '☆')).join('')}
      </Text>
      <Text style={{ color: colors.secondary }}>{rating.toFixed(1)} / 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { fontSize: 20, letterSpacing: 2 },
});
