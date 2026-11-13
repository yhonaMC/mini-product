import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { useFavorites } from './useFavorites';

/** Keeps network detail fresh while retaining a complete local favorite offline. */
export function useProductDetail(productId: number | undefined) {
  const { favorites } = useFavorites();
  const savedProduct = favorites.find(product => product.id === productId);
  const query = useQuery({
    queryKey: ['product', productId],
    queryFn: ({ signal }) => {
      if (productId === undefined) {
        throw new Error('Selecciona un producto para ver su detalle.');
      }
      return productsApi.getProduct(productId, signal);
    },
    enabled: productId !== undefined,
    initialData: savedProduct,
    // A persisted favorite must never make the required GET look freshly fetched.
    initialDataUpdatedAt: 0,
    refetchOnMount: 'always',
  });
  // initialData is only applied to a new cache entry. An earlier failed query
  // can already exist when a favorite is hydrated or added by another consumer.
  const product = query.data ?? savedProduct;

  return {
    product,
    isLoading:
      productId !== undefined && query.isPending && product === undefined,
    isRefreshing: query.isFetching && product !== undefined,
    errorMessage: query.isError
      ? query.error.message || 'No pudimos cargar este producto.'
      : null,
    retry: () => {
      query.refetch();
    },
  };
}
