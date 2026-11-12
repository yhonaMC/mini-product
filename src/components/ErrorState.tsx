import React from 'react';
import { EmptyState } from './EmptyState';

interface Props {
  message: string;
  onRetry: () => void;
  title?: string;
}

export function ErrorState({
  message,
  onRetry,
  title = 'No pudimos cargar esta página',
}: Props) {
  return (
    <EmptyState
      title={title}
      description={message}
      actionLabel="Reintentar"
      onAction={onRetry}
    />
  );
}
