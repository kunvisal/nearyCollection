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
  /** True when this is a bundle product */
  isBundle?: boolean;
  bundleDiscount?: number | null;
  bundleComponents?: Array<{
    variantId: string;
    qty: number;
    variant: {
      id: string;
      salePrice: number | string;
      stockOnHand: number;
      product: { nameKm: string; images: AdminProductImage[] };
    };
  }>;
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

/** A bundle component (one component variant + qty per bundle) as shown to the admin/UI */
export type BundleComponentView = {
  id: string;
  variantId: string;
  qty: number;
  variant: {
    id: string;
    sku: string;
    size: string;
    color: string;
    salePrice: number;
    costPrice: number;
    stockOnHand: number;
    isActive: boolean;
    product: {
      id: string;
      nameKm: string;
      nameEn: string | null;
      images: AdminProductImage[];
    };
  };
};

/** Bundle product (a Product where isBundle = true) returned by /api/admin/bundles */
export type AdminBundle = {
  id: string;
  nameKm: string;
  nameEn: string | null;
  descriptionKm: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  isBundle: true;
  bundleDiscount: number | null;
  category: { id: number; nameKm: string };
  images: AdminProductImage[];
  bundleComponents: BundleComponentView[];
  /** Server-computed availability = MIN(component.stockOnHand / component.qty) */
  availableQty: number;
  /** Server-computed unit price suggestion = Σ(component.salePrice × qty) − bundleDiscount */
  suggestedUnitPrice: number;
};

/**
 * Cart line — discriminated union covering both regular product variants and bundles.
 * Persisted in localStorage via Zustand.
 */
export type CartLineProduct = {
  kind: "product";
  variantId: string;
  productId: string;
  nameKm: string;
  nameEn?: string | null;
  salePrice: number;
  imageUrl?: string | null;
  size?: string | null;
  color?: string | null;
  sku: string;
  qty: number;
  stockOnHand: number;
};

export type CartLineBundle = {
  kind: "bundle";
  bundleProductId: string;
  nameKm: string;
  nameEn?: string | null;
  salePrice: number;
  imageUrl?: string | null;
  qty: number;
  availableQty: number;
  components: Array<{
    variantId: string;
    nameKm: string;
    size: string;
    color: string;
    qty: number;
  }>;
};

export type CartLine = CartLineProduct | CartLineBundle;

/** OrderItem with bundle linkage — used by order detail page, invoice, and tracking. */
export type OrderItemWithChildren = {
  id: string;
  variantId: string | null;
  bundleProductId: string | null;
  parentItemId: string | null;
  isBundleParent: boolean;
  productNameSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  skuSnapshot: string;
  costPriceSnapshot: number;
  salePriceSnapshot: number;
  discountSnapshot: number;
  qty: number;
  lineTotal: number;
};
