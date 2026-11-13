import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import type { ProductFilter } from '../domain/product';
import { useDebounce } from './useDebounce';

export const PRODUCTS_PAGE_SIZE = 20;

export function useProducts() {
  const [filter, setFilter] = useState<ProductFilter>({ kind: 'all' });
  const debouncedFilter = useDebounce(filter, 300);
  // Compare filter identity too: returning to an earlier search still debounces.
  const ready = filter.kind !== 'search' || debouncedFilter === filter;
  const query = useInfiniteQuery({
    queryKey: ['products', filter],
    enabled: ready,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      productsApi.getProducts({
        filter:
          filter.kind === 'search'
            ? { kind: 'search', query: filter.query.trim() }
            : filter,
        limit: PRODUCTS_PAGE_SIZE,
        skip: pageParam,
        signal,
      }),
    getNextPageParam: (last, pages, lastSkip) => {
      const nextSkip = last.skip + last.products.length;
      if (
        last.products.length === 0 ||
        nextSkip >= last.total ||
        nextSkip <= lastSkip
      ) {
        return undefined;
      }
      const previousIds = new Set(
        pages.slice(0, -1).flatMap(page => page.products.map(item => item.id)),
      );
      return last.products.some(item => !previousIds.has(item.id))
        ? nextSkip
        : undefined;
    },
    staleTime: 60_000,
    retry: false,
  });
  const products = useMemo(() => {
    if (!ready) {
      return [];
    }
    const seen = new Set<number>();
    return (query.data?.pages.flatMap(page => page.products) ?? []).filter(
      product => {
        if (seen.has(product.id)) {
          return false;
        }
        seen.add(product.id);
        return true;
      },
    );
  }, [query.data, ready]);
  const setSearchText = useCallback((text: string) => {
    setFilter(text.trim() ? { kind: 'search', query: text } : { kind: 'all' });
  }, []);
  const selectCategory = useCallback((slug: string | null) => {
    setFilter(slug ? { kind: 'category', slug } : { kind: 'all' });
  }, []);
  const {
    fetchNextPage,
    refetch,
    isFetching,
    hasNextPage,
    isFetchNextPageError,
  } = query;
  const loadMore = useCallback(() => {
    if (ready && hasNextPage && !isFetching && !isFetchNextPageError) {
      // React Query also guards multiple onEndReached events in the same render.
      fetchNextPage({ cancelRefetch: false });
    }
  }, [ready, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const retry = useCallback(() => {
    if (!ready || isFetching) {
      return;
    }
    if (isFetchNextPageError) {
      fetchNextPage({ cancelRefetch: false });
    } else {
      refetch({ cancelRefetch: false });
    }
  }, [ready, isFetching, isFetchNextPageError, fetchNextPage, refetch]);

  return {
    products,
    searchText: filter.kind === 'search' ? filter.query : '',
    selectedCategory: filter.kind === 'category' ? filter.slug : null,
    setSearchText,
    selectCategory,
    isLoading: !ready || query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: ready && Boolean(hasNextPage),
    error: ready && !isFetchNextPageError ? query.error : null,
    nextPageError: ready && isFetchNextPageError ? query.error : null,
    loadMore,
    retry,
  };
}
