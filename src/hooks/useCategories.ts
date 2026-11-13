import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { productsApi } from '../api/productsApi';

export function useCategories() {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => productsApi.getCategories(signal),
    staleTime: 30 * 60 * 1_000,
    retry: false,
  });
  const { refetch } = query;
  const retry = useCallback(() => {
    refetch({ cancelRefetch: false });
  }, [refetch]);

  return {
    categories: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    retry,
  };
}
