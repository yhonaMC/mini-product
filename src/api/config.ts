import type { HttpClientConfig } from './contracts';

/** Passed to the HTTP client factory; callers can supply another base URL in tests/builds. */
export const apiConfig: HttpClientConfig = {
  baseUrl: 'https://dummyjson.com',
  timeoutMs: 12_000,
};
