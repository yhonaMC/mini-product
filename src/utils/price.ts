import { formatCurrency } from '../native/currencyFormatter';

/** Negative prices become zero; discounts outside 0–100 are clamped. */
export function calculateDiscountedPrice(
  price: number,
  discountPercentage: number,
): number {
  if (!Number.isFinite(price) || !Number.isFinite(discountPercentage)) {
    throw new RangeError('El precio y el descuento deben ser números finitos.');
  }
  const discount = Math.min(100, Math.max(0, discountPercentage));
  const discounted = Math.max(0, price) * (1 - discount / 100);
  const cents = discounted * 100;
  // Very large finite numbers already have no representable fractional cents.
  if (!Number.isFinite(cents)) {
    return discounted;
  }
  return Math.round(cents + Number.EPSILON * Math.abs(cents)) / 100;
}

export function formatPrice(
  value: number,
  currency = 'USD',
  locale = 'es-CO',
): string {
  return formatCurrency(value, currency, locale);
}
