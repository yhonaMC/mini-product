import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { calculateDiscountedPrice, formatPrice } from '../utils/price';
import { useTheme } from '../theme/ThemeProvider';

export function PriceTag({
  price,
  discountPercentage,
}: {
  price: number;
  discountPercentage: number;
}) {
  const { colors } = useTheme();
  const discounted = calculateDiscountedPrice(price, discountPercentage);
  const hasDiscount = discountPercentage > 0;
  return (
    <View style={styles.row}>
      <Text style={[styles.current, { color: colors.text }]}>
        {formatPrice(discounted)}
      </Text>
      {hasDiscount ? (
        <>
          <Text
            accessibilityLabel={`Precio original ${formatPrice(price)}`}
            style={[styles.original, { color: colors.secondary }]}
          >
            {formatPrice(price)}
          </Text>
          <Text
            style={[styles.badge, { color: colors.success }]}
          >{`−${discountPercentage.toFixed(0)} %`}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  current: { fontSize: 20, fontWeight: '800' },
  original: { fontSize: 13, textDecorationLine: 'line-through' },
  badge: { fontSize: 12, fontWeight: '700' },
});
