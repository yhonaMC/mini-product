import type { Product } from '../../domain/product';

export function makeProduct(id = 1): Product {
  return {
    id,
    title: `Producto ${id}`,
    description: 'Una descripción completa disponible sin conexión.',
    category: 'beauty',
    price: 10.99,
    discountPercentage: 15,
    rating: 4.5,
    stock: 12,
    tags: ['beauty', 'mascara'],
    brand: 'Essence',
    sku: `SKU-${id}`,
    weight: 2,
    dimensions: { width: 5, height: 10, depth: 3 },
    warrantyInformation: '1 año',
    shippingInformation: 'Envío en 3 días',
    availabilityStatus: 'In Stock',
    reviews: [
      {
        rating: 5,
        comment: 'Excelente',
        date: '2026-11-12',
        reviewerName: 'Ana',
        reviewerEmail: 'ana@example.com',
      },
    ],
    returnPolicy: '30 días',
    minimumOrderQuantity: 1,
    meta: {
      createdAt: '2026-11-01',
      updatedAt: '2026-11-12',
      barcode: '123456789',
      qrCode: 'https://example.com/qr.png',
    },
    thumbnail: 'https://example.com/thumb.jpg',
    images: ['https://example.com/product.jpg'],
  };
}
