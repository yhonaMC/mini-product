import {
  createHttpClient,
  HttpError,
  NetworkError,
  TimeoutError,
} from './httpClient';

const client = createHttpClient({
  baseUrl: 'https://catalog.example/api/',
  timeoutMs: 1_000,
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('httpClient', () => {
  let fetchMock: jest.SpyInstance<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('uses the configured URL, JSON headers and an owned cancellation signal', async () => {
    const body = { products: [{ id: 7 }], total: 1, skip: 0, limit: 20 };
    fetchMock.mockResolvedValue(jsonResponse(body));

    await expect(client.get('/products?limit=20&skip=0')).resolves.toEqual(
      body,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://catalog.example/api/products?limit=20&skip=0',
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: expect.objectContaining({ aborted: false }),
      },
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([404, 500])(
    'preserves HTTP %s without turning it into a network error',
    async status => {
      const json = jest.fn();
      fetchMock.mockResolvedValue({
        ok: false,
        status,
        statusText: 'Failure',
        json,
      } as unknown as Response);

      const error = await client
        .get('/products/1')
        .catch((failure: unknown) => failure);

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({
        status,
        statusText: 'Failure',
        url: 'https://catalog.example/api/products/1',
      });
      expect(json).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('wraps connection failures with the original cause', async () => {
    const cause = new TypeError('Network request failed');
    fetchMock.mockRejectedValue(cause);

    const error = await client
      .get('/products')
      .catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({ originalError: cause });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('aborts and rejects on timeout even if fetch never settles', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const outcome = client
      .get('/products')
      .catch((failure: unknown) => failure);

    jest.advanceTimersByTime(999);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    jest.advanceTimersByTime(1);

    await expect(outcome).resolves.toBeInstanceOf(TimeoutError);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('honors a request timeout override', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const outcome = client
      .get('/products', { timeoutMs: 40 })
      .catch((failure: unknown) => failure);

    jest.advanceTimersByTime(40);

    await expect(outcome).resolves.toMatchObject({
      name: 'TimeoutError',
      timeoutMs: 40,
    });
  });

  it('propagates external cancellation as AbortError and removes its listener', async () => {
    const external = new AbortController();
    const removeListener = jest.spyOn(external.signal, 'removeEventListener');
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const outcome = client
      .get('/products', { signal: external.signal })
      .catch((failure: unknown) => failure);

    external.abort();

    await expect(outcome).resolves.toMatchObject({ name: 'AbortError' });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start a request whose external signal is already aborted', async () => {
    const external = new AbortController();
    external.abort();

    await expect(
      client.get('/products', { signal: external.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('still allows cancellation while the response body is loading', async () => {
    const external = new AbortController();
    const json = jest.fn(() => new Promise(() => {}));
    fetchMock.mockResolvedValue({ ok: true, json } as unknown as Response);
    const outcome = client
      .get('/products', { signal: external.signal })
      .catch((failure: unknown) => failure);
    await Promise.resolve();
    expect(json).toHaveBeenCalled();

    external.abort();

    await expect(outcome).resolves.toMatchObject({ name: 'AbortError' });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('detaches external cancellation after success', async () => {
    const external = new AbortController();
    const removeListener = jest.spyOn(external.signal, 'removeEventListener');
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    await client.get('/products/1', { signal: external.signal });
    external.abort();

    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });
});
