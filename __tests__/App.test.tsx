import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { ThemeProvider } from '../src/theme/ThemeProvider';

test('changes appearance from the accessible control and can restore it', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  const initialDark =
    screen.queryByRole('button', { name: 'Activar modo claro' }) !== null;
  fireEvent.press(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo claro' : 'Activar modo oscuro',
    }),
  );
  expect(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo oscuro' : 'Activar modo claro',
    }),
  ).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo oscuro' : 'Activar modo claro',
    }),
  );
  expect(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo claro' : 'Activar modo oscuro',
    }),
  ).toBeOnTheScreen();
});
