import NativeCurrencyFormatter from './NativeCurrencyFormatter';

/** Formats an amount using the device locale rules and the currency's fraction digits. */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'es-CO',
): string {
  if (!Number.isFinite(value)) {
    throw new RangeError('Currency amount must be finite');
  }

  if (NativeCurrencyFormatter !== null) {
    // A registered module's failure must reach the caller instead of hiding a native defect.
    return NativeCurrencyFormatter.format(value, currency, locale);
  }

  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    value,
  );
}
