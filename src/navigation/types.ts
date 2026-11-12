import type { NavigatorScreenParams } from '@react-navigation/native';

export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: number };
};

export type RootTabParamList = {
  Products: NavigatorScreenParams<ProductsStackParamList> | undefined;
  Detail: undefined;
  Favorites: undefined;
};
