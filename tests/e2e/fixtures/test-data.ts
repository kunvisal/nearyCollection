/**
 * Shared test constants and helpers.
 * Credentials are read from environment variables so they never appear in source.
 * Set TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD in .env.local before running tests.
 */

export const ADMIN_CREDENTIALS = {
  username: process.env.TEST_ADMIN_USERNAME ?? "admin",
  password: process.env.TEST_ADMIN_PASSWORD ?? "",
};

export const ROUTES = {
  home: "/",
  signin: "/signin",
  admin: "/admin",
  adminOrders: "/admin/orders",
  adminProducts: "/admin/products",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  checkoutPayment: "/checkout/payment",
  orderTracking: "/orders/track",
} as const;

/** Auth state file used across all admin test specs */
export const ADMIN_AUTH_FILE = "tests/.auth/admin.json";

/** A small 1×1 red PNG (base64) used as a fake payment slip in ABA tests */
export const DUMMY_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

/** Sample checkout form data for COD tests */
export const SAMPLE_CUSTOMER = {
  fullName: "QA Test Customer",
  phone: "0123456789",
  address: "123 Test Street, Phnom Penh",
} as const;
