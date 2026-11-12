export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
  ) {
    super(`La solicitud falló (HTTP ${status}).`);
    this.name = 'HttpError';
  }
}

export class NetworkError extends Error {
  constructor(readonly originalError: unknown) {
    super('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super('La solicitud tardó demasiado. Inténtalo de nuevo.');
    this.name = 'TimeoutError';
  }
}

export function createAbortError(): Error {
  const error = new Error('La solicitud fue cancelada.');
  error.name = 'AbortError';
  return error;
}
