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

## Flow 4: Order Verification & Fulfillment (Admin Panel)

*Objective: Act as the admin to approve the payment and complete the delivery lifecycle.*

1. **View Orders:** Go to Orders (`/admin/orders`):
   - You should see the newly placed order with a status of `NEW` and payment status `UNPAID` (or `PENDING_VERIFICATION` if a slip was uploaded).
2. **View Order Details:**
   - Click the **View** button for that order.
   - Review the customer information and purchased items.
3. **Update Statuses:**
   - **Payment Verification:** If you are testing a bank transfer, change the Payment Status to `PAID` once verified.
   - **Order Lifecycle:** Change the Order Status from `NEW` &rarr; `PROCESSING` &rarr; `SHIPPED` &rarr; `DELIVERED`. 
   - *Behind the scenes, changing these statuses correctly deducts and manages the stock logic inside the database.*

## Flow 5: Analytics & Inventory Monitoring (Admin Panel)

*Objective: Verify that the dashboard metrics and inventory alerts update exactly as expected after a sale.*

1. **Check Dashboard Metrics:** Go to the Admin Dashboard (`/admin`):
   - **Verify** that your "Total Orders" and "Total Revenue" numeric cards have increased based on the order you just processed in Flow 4.
   - **Verify** the new order appears in the "Recent Orders" table.
2. **Check Inventory Alerts:** Go to Inventory Alerts (`/admin/inventory`):
   - You should now see the "Elegant Summer Dress" listed in the **Low Stock Variants** table (because we initially set it to 5, and the purchase deducted the stock further, bringing it below the alert threshold).
   - Look at the **Recent Inventory Movements** table. You should see a detailed transaction log indicating that `1` item was `DEDUCT`-ed due to the order fulfillment!

---

**Testing Complete!** If every step above functions smoothly, the End-to-End architecture of the Neary Collection project is fully validated and operational.
