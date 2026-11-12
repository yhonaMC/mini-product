import type { NavigatorScreenParams } from '@react-navigation/native';

export type ProductsStackParamList = {
  ProductsList: undefined;
};

export type RootTabParamList = {
  Products: NavigatorScreenParams<ProductsStackParamList> | undefined;
  Detail: { productId: number } | undefined;
  Favorites: undefined;
};
