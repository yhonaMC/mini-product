import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BaseScreen } from '../screens/BaseScreen';
import { ThemeToggle } from '../components/ThemeToggle';
import { StorageNotice } from '../components/StorageNotice';
import { useTheme } from '../theme/ThemeProvider';
import { useFavorites } from '../hooks/useFavorites';
import { DetailPlaceholder, FavoritesPlaceholder } from './PlaceholderScreens';
import type { ProductsStackParamList, RootTabParamList } from './types';

const Tabs = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<ProductsStackParamList>();

function renderThemeToggle() {
  return <ThemeToggle />;
}

function ProductsNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerRight: renderThemeToggle,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ProductsList"
        component={BaseScreen}
        options={{ title: 'MiniTienda' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={DetailPlaceholder}
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
  const symbol =
    name === 'Products' ? '▦' : name === 'Detail' ? '◇' : '\u2665\uFE0E';
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ color, fontSize: size }}
    >
      {symbol}
    </Text>
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
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.surface },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.secondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
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
            component={DetailPlaceholder}
            options={{
              title: 'Detalle',
              tabBarAccessibilityLabel: 'Ver detalle del producto seleccionado',
            }}
          />
          <Tabs.Screen
            name="Favorites"
            component={FavoritesPlaceholder}
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
