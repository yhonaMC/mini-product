import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { AppIcon } from '../../components/AppIcon';
import { ErrorState } from '../../components/ErrorState';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import type { Product } from '../../domain/product';
import { useCategories } from '../../hooks/useCategories';
import { useOpenProduct } from '../../hooks/useOpenProduct';
import { useProducts } from '../../hooks/useProducts';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

const productKey = (product: Product) => String(product.id);

export function ProductsScreen() {
  const { colors } = useTheme();
  const catalog = useProducts();
  const categories = useCategories();
  const openProduct = useOpenProduct();
  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductCard product={item} onPress={openProduct} />
    ),
    [openProduct],
  );

  const error = catalog.nextPageError ?? catalog.error;
  const header = (
    <View style={styles.header}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        Encuentra tu próximo favorito
      </Text>
      <View
        style={[
          styles.searchField,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <AppIcon name="search" color={colors.secondary} size={20} />
        <TextInput
          accessibilityLabel="Buscar productos"
          placeholder="Buscar productos"
          placeholderTextColor={colors.secondary}
          selectionColor={colors.primary}
          value={catalog.searchText}
          onChangeText={catalog.setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          style={[
            styles.search,
            {
              color: colors.text,
            },
          ]}
        />
        {catalog.searchText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            onPress={() => catalog.setSearchText('')}
            style={styles.clearSearch}
          >
            <AppIcon name="close" color={colors.secondary} size={18} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {[{ slug: '', name: 'Todas' }, ...categories.categories].map(
          category => {
            const selected = (catalog.selectedCategory ?? '') === category.slug;
            return (
              <Pressable
                key={category.slug}
                accessibilityRole="button"
                accessibilityLabel={`Categoría ${category.name}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  Keyboard.dismiss();
                  catalog.selectCategory(category.slug || null);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: selected ? colors.onPrimary : colors.secondary },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>
      {categories.isLoading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando categorías"
          color={colors.primary}
        />
      ) : null}
      {categories.error ? (
        <View style={styles.categoryError}>
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {categories.error.message}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar categorías"
            onPress={categories.retry}
            style={styles.retryCategories}
          >
            <Text style={{ color: colors.primary }}>Reintentar categorías</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        ListHeaderComponent={header}
        testID="products-list"
        data={catalog.products}
        renderItem={renderProduct}
        keyExtractor={productKey}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={catalog.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          catalog.isLoading ? (
            <Skeleton />
          ) : catalog.error ? (
            <ErrorState
              message={catalog.error.message}
              onRetry={catalog.retry}
            />
          ) : (
            <EmptyState
              title="No encontramos productos"
              description="Prueba otra búsqueda o elige una categoría diferente."
            />
          )
        }
        ListFooterComponent={
          catalog.products.length > 0 ? (
            <View style={styles.footer}>
              {catalog.isFetchingNextPage ? (
                <ActivityIndicator
                  accessibilityLabel="Cargando más productos"
                  color={colors.primary}
                />
              ) : error ? (
                <ErrorState
                  title="No pudimos cargar más productos"
                  message={error.message}
                  onRetry={catalog.retry}
                />
              ) : catalog.hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cargar más productos"
                  onPress={catalog.loadMore}
                  style={styles.loadMore}
                >
                  <Text style={{ color: colors.primary }}>
                    Cargar más productos
                  </Text>
                </Pressable>
              ) : (
                <Text style={{ color: colors.secondary }}>
                  Llegaste al final
                </Text>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingVertical: 20,
    gap: spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
    maxWidth: 350,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  search: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 15,
  },
  clearSearch: {
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: { gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  categoryError: { gap: spacing.xs },
  retryCategories: { minHeight: 44, justifyContent: 'center' },
  list: {
    paddingHorizontal: 20,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  footer: { paddingBottom: spacing.lg, alignItems: 'center' },
  loadMore: { minHeight: 48, padding: spacing.md, justifyContent: 'center' },
});
