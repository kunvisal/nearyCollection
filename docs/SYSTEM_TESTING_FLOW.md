# Neary Collection - End-to-End Testing Flow Guide

This document provides a step-by-step guide to testing the entire e-commerce lifecycle—from the Admin configuring the store, to the Customer making a purchase, to the Admin fulfilling that order. 

Follow these flows sequentially to verify that all systems are working perfectly together.

---

## Flow 1: Store Initialization (Admin Panel)

*Objective: Set up the foundational settings and categories so the store functions properly.*

1. **Access Admin Panel:** Navigate to `http://localhost:3000/admin` (Log in with your Admin credentials).
2. **Configure Settings:** Go to Admin Settings (`/admin/settings`):
   - Update the **Phnom Penh** and **Province Delivery Fees**.
   - Input your **ABA** and **Wing** payment instructions.
   - Expand the **Telegram Integration** section, input your Bot Token (`7477969874:AAH5Z_yYhA5rWJ48c6uFzXfXXi3C23E-w6I`) and Chat ID (`662589574`), and click "Test Notification" to ensure your bot messages you successfully. Click **Save Settings**.
3. **Create Categories:** Go to Categories (`/admin/categories`):
   - Click **Add Category**. Create at least 2 distinct categories (e.g., "Dresses", "Tops") and verify they appear in the list.

## Flow 2: Product & Inventory Setup (Admin Panel)

*Objective: Create a purchasable product with variations and stock.*

1. **Create Product:** Go to Products (`/admin/products`):
   - Click **Add Product**.
   - Input the Name (e.g., "Elegant Summer Dress") and Description, then select one of the categories you created.
   - Upload 1-2 product images.
2. **Setup Product Variants:**
   - Scroll down to the **Variants** section on the Product form.
   - Add a variant (e.g., Size: `M`, Color: `Red`). 
   - Set the `Cost Price` ($10), `Sale Price` ($25), and crucially, set **`Stock on Hand` to `5`** (this is important to test the low-stock alert later).

## Flow 3: The Customer Shopping Experience (Storefront)

*Objective: Simulate a real buyer browsing the store and checking out.*

1. **Access Storefront (Incognito):** Open `http://localhost:3000/` in an Incognito/Private window to simulate a fresh customer.
2. **Browse & Add to Cart:**
   - Scroll through the Home Page or navigate to the Category grid.
   - Click on the "Elegant Summer Dress" you created.
   - On the Product Detail page, select your variant (Size/Color) and click **Add to Cart**.
3. **Checkout Process:**
   - Open the Cart drawer and click **Checkout**.
   - Fill out the Customer Details (Name, Phone, Delivery Address).
   - Select the Delivery Zone. **Verify** that the delivery fee updates dynamically based on the Admin Settings you configured in Flow 1.
   - Select a Payment Method (e.g., `ABA Bank`). **Verify** your custom ABA instruction text appears.
   - Click **Place Order**.
4. **Order Confirmation:**
   - You should be redirected to the success page (`/checkout/success`).
   - Copy the generated `Order Code`. 
   - **Verify Telegram:** Check your Telegram app. You should have instantly received a "🎉 New Order Received!" notification with the order details.

## Flow 4: Point of Sale (POS) Order Creation (Admin Panel)

*Objective: Test the staff's ability to create an order directly from the Admin Panel.*

1. **Access POS Interface:** Go to POS (`/admin/pos`).
2. **Search and Add to Cart:**
   - Search for "Elegant Summer Dress".
   - Click on the product and select the variant created in Flow 2.
   - Adjust the quantity.
3. **Checkout:**
   - Fill in the customer details and delivery zone.
   - Click **Place Order & Auto-Confirm**.
4. **Order Confirmation:**
   - **Verify Status & State:** The cart should clear. The order status is automatically set to `PROCESSING`. The screen should remain on the POS interface to allow immediate entry of a new order.
   - **Verify Payment:** If you selected a Province Delivery Zone, the Payment Status is automatically set to `PAID`. Otherwise, it's `UNPAID`.
   - Verify Telegram notification is received for the POS order.

## Flow 5: Accelerated Order Fulfillment (Admin Panel)

*Objective: Test the dedicated packaging and delivery workflows for processing orders.*

1. **Order Packaging:** Go to Packaging (`/admin/packaging`):
   - You should see your POS order here automatically because its status was set to `PROCESSING`. For the Storefront order from Flow 3, navigate to Orders (`/admin/orders`) and change its status to `PROCESSING` to simulate admin approval.
   - Refresh or go back to Packaging (`/admin/packaging`). You should see both `PROCESSING` orders.
   - Click the **Telegram** or **Phone** buttons to test the customer contact links.
   - Click **Confirm Packed** to move the orders directly to `SHIPPED`. They will disappear from this view and be sent to delivery.
2. **Order Delivery:** Go to Delivery (`/admin/delivery`):
   - You should see the orders here that are now `SHIPPED`.
   - Click **Delivered** to mark an order as successfully delivered. The status will update to `DELIVERED`. If it was previously unpaid (e.g., PP Zone), its payment status will automatically update to `PAID`.
   - Alternatively, test a failed delivery by clicking **Fail / Return** on another order to cancel it and return stock to the system.

## Flow 6: Analytics & Inventory Monitoring (Admin Panel)

*Objective: Verify that the dashboard metrics and inventory alerts update exactly as expected after a sale.*

1. **Check Dashboard Metrics:** Go to the Admin Dashboard (`/admin`):
   - **Verify** that your "Total Orders" and "Total Revenue" numeric cards have increased based on the orders you just processed in the previous flows.
   - **Verify** the newer orders appear in the "Recent Orders" table.
2. **Check Inventory Alerts:** Go to Inventory Alerts (`/admin/inventory`):
   - You should now see the "Elegant Summer Dress" listed in the **Low Stock Variants** table (because we initially set it to 5, and the purchase deducted the stock further, bringing it below the alert threshold).
   - Look at the **Recent Inventory Movements** table. You should see a detailed transaction log indicating that items were `DEDUCT`-ed due to the order fulfillment!

---

**Testing Complete!** If every step above functions smoothly, the End-to-End architecture of the Neary Collection project is fully validated and operational.
