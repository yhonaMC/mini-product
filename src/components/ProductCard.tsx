import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../domain/product';
import { useTheme } from '../theme/ThemeProvider';
import { FavoriteButton } from './FavoriteButton';
import { PriceTag } from './PriceTag';
import { ProductImage } from './ProductImage';

interface Props {
  product: Product;
  onPress: (id: number) => void;
}

/** FlatList rows retain product references while search input changes; memo skips that work. */
export const ProductCard = memo(function ProductCard({
  product,
  onPress,
}: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.content}>
        <ProductImage
          accessibilityLabel={`Imagen de ${product.title}`}
          style={styles.image}
          uri={product.thumbnail}
          onPress={() => onPress(product.id)}
          actionLabel={`Abrir ${product.title}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${product.title}`}
          onPress={() => onPress(product.id)}
          style={styles.info}
        >
          <Text style={[styles.category, { color: colors.secondary }]}>
            {product.category.replace(/-/g, ' ')}
          </Text>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <PriceTag
            price={product.price}
            discountPercentage={product.discountPercentage}
          />
        </Pressable>
      </View>
      <View style={styles.favorite}>
        <FavoriteButton product={product} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  content: { padding: 16, gap: 12 },
  image: { width: '100%', height: 180 },
  info: { gap: 8 },
  category: { fontSize: 12, textTransform: 'capitalize' },
  title: { fontSize: 18, fontWeight: '700', paddingRight: 32 },
  favorite: { position: 'absolute', top: 12, right: 12 },
});
