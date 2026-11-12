import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from '../theme/ThemeProvider';

test('contains a render failure and lets the user recover after retry', () => {
  // React logs a caught render exception too; keep this expected failure out of the test output.
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  let shouldThrow = true;
  function Content() {
    if (shouldThrow) {
      throw new Error('Simulated render failure');
    }
    return <Text>Tienda recuperada</Text>;
  }
  const onReset = jest.fn();
  try {
    render(
      <ThemeProvider>
        <ErrorBoundary onReset={onReset}>
          <Content />
        </ErrorBoundary>
      </ThemeProvider>,
    );
    expect(screen.getByText('Algo salió mal')).toBeOnTheScreen();
    expect(screen.queryByText('Tienda recuperada')).not.toBeOnTheScreen();
    shouldThrow = false;
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tienda recuperada')).toBeOnTheScreen();
  } finally {
    errorLog.mockRestore();
  }
});
