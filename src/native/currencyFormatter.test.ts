import * as NativeModule from './NativeCurrencyFormatter';
import { formatCurrency } from './currencyFormatter';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('formatCurrency with a registered native module', () => {
  it('passes the amount and default currency/locale to the native formatter', () => {
    const format = jest.fn(() => 'US$ 12,50');
    jest.replaceProperty(NativeModule, 'default', { format });

    expect(formatCurrency(12.5)).toBe('US$ 12,50');
    expect(format).toHaveBeenCalledWith(12.5, 'USD', 'es-CO');
  });

  it('passes an explicit currency and locale without reformatting native output', () => {
    const format = jest.fn(() => '1.234,56 €');
    jest.replaceProperty(NativeModule, 'default', { format });

    expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');
    expect(format).toHaveBeenCalledWith(1234.56, 'EUR', 'de-DE');
  });

  it('propagates native errors instead of masking them with Intl output', () => {
    const nativeError = new Error('Native formatting failed');
    const format = jest.fn(() => {
      throw nativeError;
    });
    jest.replaceProperty(NativeModule, 'default', { format });

    expect(() => formatCurrency(12)).toThrow(nativeError);
  });

  it.each([NaN, Infinity, -Infinity])(
    'rejects %s before crossing the native boundary',
    value => {
      const format = jest.fn();
      jest.replaceProperty(NativeModule, 'default', { format });

      expect(() => formatCurrency(value)).toThrow(RangeError);
      expect(format).not.toHaveBeenCalled();
    },
  );
});

describe('formatCurrency when the native module is absent', () => {
  beforeEach(() => {
    jest.replaceProperty(NativeModule, 'default', null);
  });

  it('formats USD using the default Colombian Spanish locale', () => {
    expect(formatCurrency(1234.56)).toBe(
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD',
      }).format(1234.56),
    );
  });

  it('uses the supplied locale and currency fraction digits', () => {
    expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56\u00a0€');
    expect(formatCurrency(1234.56, 'JPY', 'en-US')).toBe('¥1,235');
    expect(formatCurrency(1.2345, 'KWD', 'en-US')).toBe('KWD\u00a01.235');
  });

  it('supports zero, negative values, rounding and large finite amounts', () => {
    expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
    expect(formatCurrency(-12.345, 'USD', 'en-US')).toBe('-$12.35');
    expect(formatCurrency(Number.MAX_SAFE_INTEGER, 'USD', 'en-US')).toBe(
      '$9,007,199,254,740,991.00',
    );
  });

  it('reports invalid currency and locale arguments', () => {
    expect(() => formatCurrency(10, 'INVALID', 'en-US')).toThrow(RangeError);
    expect(() => formatCurrency(10, 'USD', 'invalid_locale')).toThrow(
      RangeError,
    );
  });

  it.each([NaN, Infinity, -Infinity])(
    'rejects non-finite %s in the fallback too',
    value => {
      expect(() => formatCurrency(value)).toThrow(RangeError);
    },
  );
});

it('looks up the optional CurrencyFormatter TurboModule by its registered name', () => {
  jest.isolateModules(() => {
    const { TurboModuleRegistry } =
      jest.requireActual<typeof import('react-native')>('react-native');
    const get = jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    // Reload the spec to verify registration independently of the formatter behavior tests.
    jest.requireActual('./NativeCurrencyFormatter');
    expect(get).toHaveBeenCalledWith('CurrencyFormatter');
  });
});
