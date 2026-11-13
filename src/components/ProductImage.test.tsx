import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProductImage } from './ProductImage';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { darkColors, lightColors } from '../theme/tokens';

const uri = 'https://example.com/product.jpg';
const label = 'Imagen de aceite';

function imageView(imageUri = uri) {
  return (
    <ThemeProvider>
      <ProductImage
        uri={imageUri}
        accessibilityLabel={label}
        style={{ height: 180 }}
      />
      <ThemeToggle />
    </ThemeProvider>
  );
}

test('announces an image failure and remounts its native image on retry with the same cached URI', () => {
  render(imageView());
  const initialImage = screen.getByRole('image', { name: label });
  expect(initialImage).toHaveProp('source', { uri, cache: 'immutable' });

  fireEvent(initialImage, 'onError', { nativeEvent: { error: 'offline' } });

  expect(initialImage).not.toBeOnTheScreen();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'No se pudo cargar la imagen.',
  );
  fireEvent.press(
    screen.getByRole('button', { name: `Reintentar imagen: ${label}` }),
  );

  const retriedImage = screen.getByRole('image', { name: label });
  expect(retriedImage).not.toBe(initialImage);
  expect(retriedImage).toHaveProp('source', { uri, cache: 'immutable' });
  expect(screen.queryByRole('alert')).toBeNull();

  fireEvent(retriedImage, 'onError');
  fireEvent.press(
    screen.getByRole('button', { name: `Reintentar imagen: ${label}` }),
  );
  expect(screen.getByRole('image', { name: label })).not.toBe(retriedImage);
});

test('starts a different URI with a clean error state in a recycled component', () => {
  const { rerender } = render(imageView());
  fireEvent(screen.getByRole('image', { name: label }), 'onError');
  expect(screen.getByRole('alert')).toBeOnTheScreen();

  rerender(imageView('https://example.com/different.jpg'));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('image', { name: label })).toHaveProp('source', {
    uri: 'https://example.com/different.jpg',
    cache: 'immutable',
  });
});

test('keeps the error and retry readable when the real theme changes', () => {
  render(imageView());
  fireEvent(screen.getByRole('image', { name: label }), 'onError');
  expect(screen.getByRole('alert')).toHaveStyle({
    color: lightColors.secondary,
  });
  expect(
    screen.getByRole('button', { name: `Reintentar imagen: ${label}` }),
  ).toHaveStyle({ backgroundColor: lightColors.primary });

  fireEvent.press(screen.getByRole('button', { name: 'Activar modo oscuro' }));

  expect(screen.getByRole('alert')).toHaveStyle({
    color: darkColors.secondary,
  });
  expect(
    screen.getByRole('button', { name: `Reintentar imagen: ${label}` }),
  ).toHaveStyle({ backgroundColor: darkColors.primary });
  expect(screen.getByText('Reintentar imagen')).toHaveStyle({
    color: darkColors.onPrimary,
  });
});
