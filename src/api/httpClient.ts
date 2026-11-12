import { apiConfig } from './config';
import type { HttpClient, HttpClientConfig, RequestOptions } from './contracts';
import {
  createAbortError,
  HttpError,
  NetworkError,
  TimeoutError,
} from './errors';

export { HttpError, NetworkError, TimeoutError } from './errors';

export function createHttpClient(
  config: HttpClientConfig = apiConfig,
): HttpClient {
  return {
    async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
      if (options.signal?.aborted) {
        throw createAbortError();
      }

      const url = `${config.baseUrl.replace(/\/+$/, '')}/${path.replace(
        /^\/+/,
        '',
      )}`;
      const timeoutMs = options.timeoutMs ?? config.timeoutMs;
      const controller = new AbortController();
      let timedOut = false;
      const onExternalAbort = () => controller.abort();
      let onAbort: () => void = () => {};

      // Race the whole request, including JSON consumption, so cancellation
      // settles even if a fetch implementation delays its abort rejection.
      const cancellation = new Promise<never>((_, reject) => {
        onAbort = () =>
          reject(timedOut ? new TimeoutError(timeoutMs) : createAbortError());
        controller.signal.addEventListener('abort', onAbort);
      });
      options.signal?.addEventListener('abort', onExternalAbort);
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        const request = async (): Promise<T> => {
          const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new HttpError(response.status, response.statusText, url);
          }
          return (await response.json()) as T;
        };

        return await Promise.race([request(), cancellation]);
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          throw timedOut ? new TimeoutError(timeoutMs) : createAbortError();
        }
        if (error instanceof HttpError) {
          throw error;
        }
        throw new NetworkError(error);
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onExternalAbort);
        controller.signal.removeEventListener('abort', onAbort);
      }
    },
  };
}

export const httpClient = createHttpClient();
