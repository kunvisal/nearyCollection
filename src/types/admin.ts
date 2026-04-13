/**
 * Shared admin domain types.
 * These match the shapes returned by /api/admin/* endpoints.
 * Import from here instead of re-defining inline in component files.
 */

/** ProductVariant shape returned by GET /api/admin/products (used in POS and Order Edit views) */
export type AdminVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  salePrice: number;
  stockOnHand: number;
  reservedQty: number;
};

/** ProductVariant full shape returned by GET /api/admin/products/:id (detail/manage view) */
export type AdminVariantDetail = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  costPrice: number | null;
  salePrice: number;
  stockOnHand: number;
  isActive: boolean;
};

/** ProductImage minimal shape for list and POS views */
export type AdminProductImage = {
  url: string;
};

/** ProductImage full shape for product detail/manage view */
export type AdminProductImageDetail = {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
};

/** Product as returned by GET /api/admin/products — used in POS and Order Edit */
export type AdminProduct = {
  id: string;
  nameKm: string;
  nameEn: string | null;
  variants: AdminVariant[];
  images: AdminProductImage[];
  category?: { id: number; nameKm: string };
};

/**
 * Cart item — local state in POS and Order Edit pages.
 * Not stored directly in DB; converted to order items on submit.
 */
export type CartItem = {
  variantId: string;
  productId: string;
  nameKm: string;
  size: string;
  color: string;
  salePrice: number;
  qty: number;
};

/** Category as returned by GET /api/admin/categories */
export type AdminCategory = {
  id: number;
  nameKm: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
};

/** Order as returned by GET /api/admin/orders (list view) */
export type AdminOrderListItem = {
  id: string;
  orderCode: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customer: {
    fullName: string;
    phone: string;
  };
};
