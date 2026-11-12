import { formatCurrency } from '../native/currencyFormatter';
import { calculateDiscountedPrice, formatPrice } from './price';

jest.mock('../native/currencyFormatter', () => ({
  formatCurrency: jest.fn(() => 'formatted currency'),
}));

describe('calculateDiscountedPrice', () => {
  it.each([
    [100, 0, 100],
    [100, 100, 0],
    [0, 20, 0],
    [99.99, 15, 84.99],
    [19.99, 12.5, 17.49],
    [1.005, 0, 1.01],
    [10.075, 0, 10.08],
    [1e308, 0, 1e308],
    [-10, 20, 0],
    [10, -5, 10],
    [10, 150, 0],
  ])(
    'applies %s with discount %s and rounds to %s',
    (price, discount, expected) => {
      expect(calculateDiscountedPrice(price, discount)).toBe(expected);
    },
  );

  it.each([
    [NaN, 10],
    [Infinity, 10],
    [10, NaN],
    [10, -Infinity],
  ])('rejects non-finite input (%s, %s)', (price, discount) => {
    expect(() => calculateDiscountedPrice(price, discount)).toThrow(RangeError);
  });
});

describe('formatPrice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates formatting to the native wrapper with the application defaults', () => {
    expect(formatPrice(12.5)).toBe('formatted currency');
    expect(formatCurrency).toHaveBeenCalledWith(12.5, 'USD', 'es-CO');
  });

  it('forwards explicit currency and locale without changing the value', () => {
    expect(formatPrice(0, 'EUR', 'de-DE')).toBe('formatted currency');
    expect(formatCurrency).toHaveBeenCalledWith(0, 'EUR', 'de-DE');
  });
});
