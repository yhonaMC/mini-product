import type {
  Category,
  Paginated,
  Product,
  ProductFilter,
} from '../domain/product';
import { httpClient } from './httpClient';

export interface GetProductsOptions {
  filter: ProductFilter;
  limit: number;
  skip: number;
  signal?: AbortSignal;
}

export const productsApi = {
  getProducts({
    filter,
    limit,
    skip,
    signal,
  }: GetProductsOptions): Promise<Paginated<Product>> {
    const pagination = `limit=${encodeURIComponent(
      limit,
    )}&skip=${encodeURIComponent(skip)}`;
    let path: string;
    switch (filter.kind) {
      case 'search':
        path = `/products/search?q=${encodeURIComponent(
          filter.query,
        )}&${pagination}`;
        break;
      case 'category':
        path = `/products/category/${encodeURIComponent(
          filter.slug,
        )}?${pagination}`;
        break;
      case 'all':
        path = `/products?${pagination}`;
        break;
    }
    return httpClient.get<Paginated<Product>>(path, { signal });
  },

  getProduct(id: number, signal?: AbortSignal): Promise<Product> {
    return httpClient.get<Product>(`/products/${encodeURIComponent(id)}`, {
      signal,
    });
  },

  getCategories(signal?: AbortSignal): Promise<Category[]> {
    return httpClient.get<Category[]>('/products/categories', { signal });
  },
};
