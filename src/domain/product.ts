/** Complete API object is retained in favorites so detail data survives offline. */
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  thumbnail: string;
  images: string[];
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export interface Paginated<T> {
  products: T[];
  total: number;
  skip: number;
  limit: number;
}

/** A discriminated union prevents search and category from being active together. */
export type ProductFilter =
  | { kind: 'all' }
  | { kind: 'search'; query: string }
  | { kind: 'category'; slug: string };
