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
          compact
          accessibilityLabel={`Imagen de ${product.title}`}
          style={[styles.image, { backgroundColor: colors.imageSurface }]}
          uri={product.thumbnail}
          onPress={() => onPress(product.id)}
          actionLabel={`Abrir ${product.title}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${product.title}`}
          onPress={() => onPress(product.id)}
          style={({ pressed }) => [styles.info, { opacity: pressed ? 0.6 : 1 }]}
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
            compact
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  content: { padding: 12, gap: 16, flexDirection: 'row', alignItems: 'center' },
  image: { width: 112, height: 160, borderRadius: 10 },
  info: { flex: 1, minWidth: 0, gap: 8, paddingVertical: 4 },
  category: { fontSize: 12, textTransform: 'capitalize', lineHeight: 18 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  favorite: { position: 'absolute', top: 16, left: 16 },
});
