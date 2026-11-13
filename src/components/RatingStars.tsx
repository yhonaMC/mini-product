import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppIcon } from './AppIcon';

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
      <View style={styles.stars}>
        {stars.map(star => (
          <AppIcon
            key={star}
            name={star <= Math.round(rating) ? 'star-filled' : 'star'}
            color={colors.rating}
            size={17}
          />
        ))}
      </View>
      <Text style={{ color: colors.secondary }}>{rating.toFixed(1)} / 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', gap: 2 },
});
