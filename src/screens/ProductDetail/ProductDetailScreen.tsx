import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FavoriteButton } from '../../components/FavoriteButton';
import { PriceTag } from '../../components/PriceTag';
import { RatingStars } from '../../components/RatingStars';
import { Skeleton } from '../../components/Skeleton';
import { ProductImage } from '../../components/ProductImage';
import type { Product } from '../../domain/product';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

function ProductImages({ product }: { product: Product }) {
  const { colors } = useTheme();
  const [viewportWidth, setViewportWidth] = useState(0);
  const imageWidth = viewportWidth;
  const images = useMemo(
    () => (product.images.length > 0 ? product.images : [product.thumbnail]),
    [product.images, product.thumbnail],
  );
  const carousel = useRef<FlatList<string>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const selectedIndex = Math.min(activeIndex, images.length - 1);

  useEffect(() => {
    if (viewportWidth <= 0) {
      return;
    }
    // Wait for cells to receive their measured width before moving the native
    // viewport. Repeated layouts with the same width do not reset the page.
    const frame = requestAnimationFrame(() => {
      const index = Math.min(activeIndexRef.current, images.length - 1);
      activeIndexRef.current = index;
      setActiveIndex(index);
      carousel.current?.scrollToOffset({
        offset: index * viewportWidth,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [viewportWidth, images]);

  function goToImage(index: number) {
    if (viewportWidth <= 0) {
      return;
    }
    const boundedIndex = Math.max(0, Math.min(images.length - 1, index));
    carousel.current?.scrollToOffset({
      offset: boundedIndex * imageWidth,
      animated: true,
    });
    activeIndexRef.current = boundedIndex;
    setActiveIndex(boundedIndex);
  }

  return (
    <View style={styles.gallery}>
      <FlatList
        ref={carousel}
        horizontal
        pagingEnabled
        style={[styles.image, { backgroundColor: colors.imageSurface }]}
        showsHorizontalScrollIndicator={false}
        data={images}
        extraData={imageWidth}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        accessibilityLabel={`Imágenes de ${product.title}`}
        onLayout={event => {
          const width = event.nativeEvent.layout.width;
          if (width > 0) {
            setViewportWidth(width);
          }
        }}
        onMomentumScrollEnd={event => {
          if (viewportWidth <= 0) {
            return;
          }
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / imageWidth,
          );
          const index = Math.max(0, Math.min(images.length - 1, nextIndex));
          activeIndexRef.current = index;
          setActiveIndex(index);
        }}
        // Mount native targets only at a measured size. Changing that size
        // remounts the target so Glide cannot reuse a tiny decoded bitmap.
        renderItem={({ item, index }) =>
          viewportWidth > 0 ? (
            <ProductImage
              key={`${item}-${imageWidth}`}
              accessibilityLabel={`${product.title}, imagen ${index + 1} de ${
                images.length
              }`}
              uri={item}
              style={[
                styles.image,
                { width: imageWidth, backgroundColor: colors.imageSurface },
              ]}
            />
          ) : null
        }
      />
      <View style={styles.galleryControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Imagen anterior"
          disabled={selectedIndex === 0}
          accessibilityState={{ disabled: selectedIndex === 0 }}
          onPress={() => goToImage(selectedIndex - 1)}
          style={styles.imageButton}
        >
          <Text
            style={{
              color: selectedIndex === 0 ? colors.secondary : colors.primary,
            }}
          >
            Anterior
          </Text>
        </Pressable>
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.secondary }}
        >
          {`Imagen ${selectedIndex + 1} de ${images.length}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Imagen siguiente"
          disabled={selectedIndex === images.length - 1}
          accessibilityState={{ disabled: selectedIndex === images.length - 1 }}
          onPress={() => goToImage(selectedIndex + 1)}
          style={styles.imageButton}
        >
          <Text
            style={{
              color:
                selectedIndex === images.length - 1
                  ? colors.secondary
                  : colors.primary,
            }}
          >
            Siguiente
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ProductDetailScreen({
  productId,
}: {
  productId: number | undefined;
}) {
  const { colors } = useTheme();
  const { product, isLoading, isRefreshing, errorMessage, retry } =
    useProductDetail(productId);

  if (productId === undefined) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Elige un producto"
          description="Abre un producto desde Productos o Favoritos para consultar su detalle."
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Skeleton detail />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          message={errorMessage ?? 'No pudimos cargar este producto.'}
          onRetry={retry}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {errorMessage ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.surface, borderColor: colors.danger },
          ]}
        >
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {errorMessage}
          </Text>
          <Text style={{ color: colors.secondary }}>
            Mostramos la última información disponible.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar actualización"
            onPress={retry}
            style={styles.retryButton}
          >
            <Text style={[styles.retryLabel, { color: colors.primary }]}>
              Reintentar actualización
            </Text>
          </Pressable>
        </View>
      ) : null}
      {isRefreshing ? (
        <View style={styles.refreshing}>
          <ActivityIndicator
            color={colors.primary}
            accessibilityLabel="Actualizando producto"
          />
          <Text style={{ color: colors.secondary }}>
            Actualizando producto…
          </Text>
        </View>
      ) : null}
      <ProductImages key={product.id} product={product} />
      <View style={styles.heading}>
        <View style={styles.titleBlock}>
          {product.brand ? (
            <Text style={[styles.brand, { color: colors.secondary }]}>
              {product.brand}
            </Text>
          ) : null}
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            {product.title}
          </Text>
        </View>
        <FavoriteButton product={product} animated />
      </View>
      <PriceTag
        price={product.price}
        discountPercentage={product.discountPercentage}
      />
      <RatingStars rating={product.rating} />
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        Descripción
      </Text>
      <Text style={[styles.description, { color: colors.text }]}>
        {product.description}
      </Text>
      {product.tags.length > 0 ? (
        <View style={styles.tags}>
          {product.tags.map(tag => (
            <Text
              key={tag}
              accessibilityLabel={`Etiqueta ${tag}`}
              style={[
                styles.tag,
                {
                  color: colors.secondary,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {tag}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  gallery: { gap: spacing.xs },
  image: { height: 300, borderRadius: 16 },
  galleryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  imageButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleBlock: { flex: 1, gap: spacing.xs },
  brand: { fontSize: 13, lineHeight: 20 },
  title: {
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  description: { fontSize: 15, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    fontSize: 13,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 6,
  },
  notice: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  retryButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  retryLabel: { fontSize: 16, fontWeight: '700' },
  refreshing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
