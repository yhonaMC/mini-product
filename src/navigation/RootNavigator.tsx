import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
  useFocusEffect,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductsScreen } from '../screens/Products/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetail/ProductDetailScreen';
import { FavoritesScreen } from '../screens/Favorites/FavoritesScreen';
import { ThemeToggle } from '../components/ThemeToggle';
import { StorageNotice } from '../components/StorageNotice';
import { AppIcon } from '../components/AppIcon';
import { useTheme } from '../theme/ThemeProvider';
import { useFavorites } from '../hooks/useFavorites';
import { useSelectionStore } from './selectionStore';
import type { ProductsStackParamList, RootTabParamList } from './types';

const Tabs = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<ProductsStackParamList>();

function renderThemeToggle() {
  return <ThemeToggle />;
}

function StackProductDetail({
  route,
}: NativeStackScreenProps<ProductsStackParamList, 'ProductDetail'>) {
  return <ProductDetailScreen productId={route.params.productId} />;
}

function SelectedProductDetail() {
  const productId = useSelectionStore(state => state.productId);
  const clearSelection = useSelectionStore(state => state.clearSelection);
  useFocusEffect(useCallback(() => clearSelection, [clearSelection]));
  return <ProductDetailScreen productId={productId} />;
}

function ProductsNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        headerRight: renderThemeToggle,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ProductsList"
        component={ProductsScreen}
        options={{ title: 'MiniTienda' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={StackProductDetail}
        options={{ title: 'Detalle del producto' }}
      />
    </Stack.Navigator>
  );
}

function TabSymbol({
  name,
  color,
  size,
}: {
  name: keyof RootTabParamList;
  color: string;
  size: number;
}) {
  return (
    <AppIcon
      name={
        name === 'Products' ? 'grid' : name === 'Detail' ? 'detail' : 'heart'
      }
      color={color}
      size={size}
    />
  );
}

const tabIcons = {
  Products: (props: { color: string; size: number }) => (
    <TabSymbol name="Products" {...props} />
  ),
  Detail: (props: { color: string; size: number }) => (
    <TabSymbol name="Detail" {...props} />
  ),
  Favorites: (props: { color: string; size: number }) => (
    <TabSymbol name="Favorites" {...props} />
  ),
};

export function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { favorites } = useFavorites();
  // Keep NavigationContainer's theme reference stable when only favorites change.
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
        notification: colors.danger,
      },
    }),
    [colors, isDark],
  );

  return (
    <View style={styles.root}>
      <StorageNotice />
      <NavigationContainer theme={navigationTheme}>
        <Tabs.Navigator
          screenOptions={({ route }) => ({
            headerRight: renderThemeToggle,
            headerRightContainerStyle: { paddingRight: 16 },
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            headerTitleStyle: { fontSize: 18, fontWeight: '600' },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.secondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingTop: 8,
              height: 64 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 8),
              elevation: 0,
            },
            tabBarBadgeStyle: {
              backgroundColor: colors.primary,
              color: colors.onPrimary,
            },
            tabBarIcon: tabIcons[route.name],
          })}
        >
          <Tabs.Screen
            name="Products"
            component={ProductsNavigator}
            options={{
              title: 'Productos',
              headerShown: false,
              tabBarAccessibilityLabel: 'Ver productos',
            }}
          />
          <Tabs.Screen
            name="Detail"
            component={SelectedProductDetail}
            options={{
              title: 'Detalle',
              tabBarAccessibilityLabel: 'Ver detalle del producto seleccionado',
            }}
          />
          <Tabs.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{
              title: 'Favoritos',
              tabBarAccessibilityLabel: 'Ver favoritos guardados',
              tabBarBadge: favorites.length || undefined,
            }}
          />
        </Tabs.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
