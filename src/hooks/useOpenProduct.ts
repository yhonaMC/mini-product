import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootTabParamList } from '../navigation/types';
import { useSelectionStore } from '../navigation/selectionStore';

export function useOpenProduct() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const selectProduct = useSelectionStore(state => state.selectProduct);
  // Shared with memoized FlatList rows so changing search text does not replace callbacks.
  return useCallback(
    (productId: number) => {
      selectProduct(productId);
      navigation.navigate('Detail');
    },
    [navigation, selectProduct],
  );
}
