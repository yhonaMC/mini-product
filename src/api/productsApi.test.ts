import { apiConfig } from './config';
import { productsApi } from './productsApi';

describe('productsApi', () => {
  let fetchMock: jest.SpyInstance<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => jest.restoreAllMocks());

  function respond(body: unknown): void {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
  }

  it('preserves pagination metadata and sends the requested skip and limit', async () => {
    const page = {
      products: [{ id: 21, title: 'Perfume' }],
      total: 45,
      skip: 20,
      limit: 20,
    };
    respond(page);

    await expect(
      productsApi.getProducts({ filter: { kind: 'all' }, limit: 20, skip: 20 }),
    ).resolves.toEqual(page);

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiConfig.baseUrl}/products?limit=20&skip=20`,
      expect.any(Object),
    );
  });

  it('encodes search text without allowing it to change pagination', async () => {
    respond({ products: [], total: 0, skip: 0, limit: 12 });

    await productsApi.getProducts({
      filter: { kind: 'search', query: 'café & té?skip=99' },
      limit: 12,
      skip: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiConfig.baseUrl}/products/search?q=caf%C3%A9%20%26%20t%C3%A9%3Fskip%3D99&limit=12&skip=0`,
      expect.any(Object),
    );
  });

  it('encodes category slugs as a single path component', async () => {
    respond({ products: [], total: 0, skip: 8, limit: 8 });

    await productsApi.getProducts({
      filter: { kind: 'category', slug: 'home/decor & more' },
      limit: 8,
      skip: 8,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiConfig.baseUrl}/products/category/home%2Fdecor%20%26%20more?limit=8&skip=8`,
      expect.any(Object),
    );
  });

  it('loads product detail and preserves the full response', async () => {
    const product = {
      id: 3,
      title: 'Bag',
      images: ['https://example.com/bag.jpg'],
      tags: ['bags'],
      meta: { barcode: '123' },
    };
    respond(product);

    await expect(productsApi.getProduct(3)).resolves.toEqual(product);

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiConfig.baseUrl}/products/3`,
      expect.any(Object),
    );
  });

  it('loads categories from the object endpoint', async () => {
    const categories = [
      {
        slug: 'beauty',
        name: 'Beauty',
        url: 'https://dummyjson.com/products/category/beauty',
      },
    ];
    respond(categories);

    await expect(productsApi.getCategories()).resolves.toEqual(categories);

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiConfig.baseUrl}/products/categories`,
      expect.any(Object),
    );
  });

  it('forwards cancellation from callers of every endpoint', async () => {
    const controller = new AbortController();
    controller.abort();
    const options = {
      filter: { kind: 'all' } as const,
      limit: 20,
      skip: 0,
      signal: controller.signal,
    };

    await expect(productsApi.getProducts(options)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(
      productsApi.getProduct(1, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await expect(
      productsApi.getCategories(controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
