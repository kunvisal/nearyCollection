import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemProduct {
    kind: 'product';
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
}

export interface CartItemBundle {
    kind: 'bundle';
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
}

export type CartItem = CartItemProduct | CartItemBundle;

export function cartItemKey(item: CartItem): string {
    return item.kind === 'product' ? item.variantId : item.bundleProductId;
}

function maxQty(item: CartItem): number {
    return item.kind === 'product' ? item.stockOnHand : item.availableQty;
}

interface CartState {
    items: CartItem[];
    isDrawerOpen: boolean;

    setIsDrawerOpen: (isOpen: boolean) => void;
    addItem: (item: Omit<CartItemProduct, 'qty'> | Omit<CartItemBundle, 'qty'>, qty?: number) => void;
    /** key = variantId for products, bundleProductId for bundles */
    removeItem: (key: string) => void;
    updateQty: (key: string, qty: number) => void;
    clearCart: () => void;

    getCartTotal: () => number;
    getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,

            setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

            addItem: (incoming, qty = 1) => {
                set((state) => {
                    const newItem = { ...(incoming as CartItem), qty } as CartItem;
                    const key = cartItemKey(newItem);
                    const idx = state.items.findIndex((i) => cartItemKey(i) === key);

                    if (idx >= 0) {
                        const updated = [...state.items];
                        const merged = { ...updated[idx], qty: updated[idx].qty + qty } as CartItem;
                        merged.qty = Math.min(merged.qty, maxQty(merged));
                        updated[idx] = merged;
                        return { items: updated, isDrawerOpen: true };
                    }
                    newItem.qty = Math.min(newItem.qty, maxQty(newItem));
                    return { items: [...state.items, newItem], isDrawerOpen: true };
                });
            },

            removeItem: (key) => {
                set((state) => ({
                    items: state.items.filter((i) => cartItemKey(i) !== key),
                }));
            },

            updateQty: (key, qty) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (cartItemKey(item) !== key) return item;
                        const clamped = Math.min(Math.max(1, qty), maxQty(item));
                        return { ...item, qty: clamped } as CartItem;
                    }),
                }));
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () =>
                get().items.reduce((total, item) => total + item.salePrice * item.qty, 0),

            getCartCount: () =>
                get().items.reduce((count, item) => count + item.qty, 0),
        }),
        {
            name: 'neary-cart-storage',
            partialize: (state) => ({ items: state.items }),
            // Migrate older persisted carts missing the discriminator tag — they are all products.
            migrate: ((persisted: unknown) => {
                const obj = persisted as { items?: Array<Record<string, unknown>> } | null | undefined;
                if (!obj?.items) return obj as never;
                return {
                    ...obj,
                    items: obj.items.map((it) =>
                        it.kind ? it : { ...it, kind: 'product' as const },
                    ),
                } as never;
            }),
            version: 2,
        }
    )
);
