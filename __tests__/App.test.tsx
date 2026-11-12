import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';

test('changes appearance from the accessible control and can restore it', () => {
  render(<App />);
  const initialDark = screen.queryByText('Apariencia: oscura') !== null;
  fireEvent.press(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo claro' : 'Activar modo oscuro',
    }),
  );
  expect(
    screen.getByText(`Apariencia: ${initialDark ? 'clara' : 'oscura'}`),
  ).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: initialDark ? 'Activar modo oscuro' : 'Activar modo claro',
    }),
  );
  expect(
    screen.getByText(`Apariencia: ${initialDark ? 'oscura' : 'clara'}`),
  ).toBeOnTheScreen();
});
