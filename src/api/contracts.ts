export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
}

export interface HttpClientConfig {
  baseUrl: string;
  timeoutMs: number;
}
