import React from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createQueryHarness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { client, wrapper: Wrapper };
}

export function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}
