# Neary Collection - Features Status

*Date: February 2026*

This document summarizes the current development status of the Neary Collection project. It lists all implemented features, currently running infrastructure, and the remaining features that need to be built in the upcoming phases. This will serve as a quick start guide for continuing development later.

## 🟩 COMPLETED FEATURES (Phases 1-4)

The Core Administration and Public Storefront have been successfully developed. Below are the details of the active features:

### 1. Foundation & Architecture Setup
- **Next.js App Router**: Configured with Tailwind CSS.
- **Prisma ORM**: Connected to Supabase PostgreSQL, schema designed covering Users, Categories, Products, Variants, Slips, Orders, Settings.
- **Service & Repository Pattern**: All database interactions are neatly separated into `lib/repositories` and `lib/services`.
- **Role-Based Access**: NextAuth implemented for Admin/User sessions (requires environment variables setup).

### 2. Admin Features (Products & Inventory)
- **Category Management**: Complete CRUD UI and API (`/admin/categories`).
- **Product Management**: Complete CRUD UI and API (`/admin/products`).
- **Product Variants**: Size, Color, SKU, Cost Price, and Sale Price management via a modal interface on the Product Edit page.
- **Image Uploading**: Supabase Storage integration for uploading product images.
- **Inventory Tracking**: 
  - `InventoryTransaction` logging for Stock In, Deduction, Adjustments.
  - Adding stock to a variant automatically records a Stock IN transaction.

### 3. Storefront (Public E-commerce)
- **Public Layout**: Universal shop layout featuring a top navigation header, a categorized bottom navigation, and a persistent Cart Drawer across all `/shop` routes.
- **Home Page**: Dynamic Hero banner, Category Grid (reading directly from DB), and "New Arrivals" & "Best Sellers" blocks.
- **Category Browsing**: Dedicated category pages (`/category/[slug]`) featuring an **Infinite Scroll (Load More)** pattern using Server Actions for smooth, Instagram/TikTok style browsing.
- **Client-Side Cart**: Configured using `Zustand` with `localStorage` persistence. Instantly responds across all tabs without DB fetches until checkout.
- **Product Detail Page**: Displays images, name, pricing, dynamic color & size selectors mapped to active variants, and an "Add to Cart" button that correctly respects the `stockOnHand` limits.

### 4. Checkout & Order Processing
- **Checkout Form**: A one-page checkout UI (`/checkout`) handling Customer Details (Guest), Delivery Zones (Phnom Penh/Province with mapped fees), and Payment Methods (ABA/COD).
- **Order Creation API**: A robust transactional Server Action that:
  - Finds or creates the Customer.
  - Validates variant stock levels.
  - Deducts stock and logs `InventoryTransaction` records.
  - Saves the Order and `OrderItem` snapshots.
- **Payment Slip Upload**: For ABA payments, post-checkout redirect to an upload page where the user can attach a screenshot of the banking receipt. The screenshot is uploaded to `payment-slips` bucket in Supabase via server actions, mapping the record directly to the created order.
- **Order Tracking**: A simple search interface (`/orders/track`) for customers to check current status using their Order Code & Phone Number.

---

### 5. Admin Order Management & Fulfillment
- **Order Management Table**: Fast, responsive Admin UI (`/admin/orders`) to list orders with robust filtering options by Status and Payment Method.
- **Order Detail View**: Comprehensive UI to review exact purchased items, shipping metadata, and attached payment slips.
- **Payment Verification Workflow**: Secure capability for admins to view the uploaded payment slip screenshot and mark the payment officially as `PAID` or `REJECTED`.
- **Order Status Pipeline**: Streamlined UI to push the order status (`NEW` &rarr; `PROCESSING` &rarr; `PACKED` &rarr; `SHIPPED` &rarr; `DELIVERED`).
- **Order Cancellation**: Admin capability to cancel orders, which correctly triggers an automated restock via `InventoryTransaction` to release reserved stock.
- **Printables**: Integrated printing of basic Receipts & Shipping Label views for packed orders directly from the browser.

### 6. Settings, Reports & Notifications
- **Telegram Bot Integration**: Ping a Telegram Chat automatically when a new order is received via the Checkout. Configured via the UI.
- **System Settings UI**: Editable configuration for flat delivery fees (PP/Province), ABA/Wing payment instructions text, and Telegram tokens.
- **Sales & Profit Analytics**: Dynamic dashboard metric cards tracking "Total Customers", "Total Orders", and "Total Revenue".
- **Inventory Alerts**: New section tracking variants falling below minimum stock thresholds (≤ 5) with historical `InventoryTransaction` logs tracking exactly when items were added/deducted.

---

## 🟩 COMPLETED PROJECT STATUS

The project has reached 100% completion based on the initial 6 Phase roadmap! All core E-Commerce features, public storefront, and admin panel modules are fully functional.

## 🛠 HOW TO RUN THE PROJECT

1. Make sure your `.env` is configured properly with:
   - `DATABASE_URL` (Supabase Postgres)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_URL` / `NEXTAUTH_SECRET`
2. Run database migrations: `npx prisma db push`
3. If this is a fresh database, create an initial admin mapping or bypass the auth middleware using the `.env` flags if testing UI locally.
4. Run `npm run dev`. Navigate to `localhost:3000/` for the storefront or `localhost:3000/admin` for the application backend.
5. Head straight to `src/app/admin/orders/page.tsx` (to be created) to begin **Phase 5**.
