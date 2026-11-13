import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import type { Product } from '../../domain/product';
import { useFavorites } from '../../hooks/useFavorites';
import { useOpenProduct } from '../../hooks/useOpenProduct';
import type { RootTabParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

function productKey(product: Product): string {
  return String(product.id);
}

export function FavoritesScreen() {
  const { favorites, removeFavorite } = useFavorites();
  const { colors } = useTheme();
  const openProduct = useOpenProduct();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const openCatalog = useCallback(
    () => navigation.navigate('Products', { screen: 'ProductsList' }),
    [navigation],
  );

  // FlatList retains its row renderer while favorites change; ProductCard also
  // keeps the shared navigation callback stable for unchanged product objects.
  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ReanimatedSwipeable
        testID={`favorite-swipe-${item.id}`}
        friction={2}
        rightThreshold={80}
        overshootRight={false}
        onSwipeableOpen={() => removeFavorite(item.id)}
        renderRightActions={() => (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.deleteAction, { backgroundColor: colors.danger }]}
          >
            <Text style={[styles.deleteLabel, { color: colors.background }]}>
              Eliminar
            </Text>
          </View>
        )}
      >
        {/* The card's labeled favorite button offers the same removal without a gesture. */}
        <ProductCard product={item} onPress={openProduct} />
      </ReanimatedSwipeable>
    ),
    [colors.background, colors.danger, openProduct, removeFavorite],
  );

  return (
    <FlatList
      accessibilityLabel="Productos favoritos guardados"
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={favorites}
      keyExtractor={productKey}
      renderItem={renderProduct}
      ListHeaderComponent={
        favorites.length > 0 ? (
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              style={[styles.title, { color: colors.text }]}
            >
              {favorites.length === 1
                ? '1 producto guardado'
                : `${favorites.length} productos guardados`}
            </Text>
            <Text style={[styles.description, { color: colors.secondary }]}>
              Disponibles sin conexión. Desliza a la izquierda para eliminar.
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          title="Tu selección empieza aquí"
          description="Guarda los productos que te gusten y los tendrás a mano, incluso sin conexión."
          actionLabel="Explorar productos"
          onAction={openCatalog}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.md },
  header: { gap: spacing.sm, paddingBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 21 },
  deleteAction: {
    width: 112,
    marginBottom: spacing.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { fontSize: 16, fontWeight: '700' },
});
