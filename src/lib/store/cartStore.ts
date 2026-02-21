import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
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

interface CartState {
    items: CartItem[];
    isDrawerOpen: boolean;

    // Actions
    setIsDrawerOpen: (isOpen: boolean) => void;
    addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
    removeItem: (variantId: string) => void;
    updateQty: (variantId: string, qty: number) => void;
    clearCart: () => void;

    // Computed values that we can just calculate on the fly in components, 
    // but helpful to have in store if needed
    getCartTotal: () => number;
    getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,

            setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

            addItem: (item, qty = 1) => {
                set((state) => {
                    const existingItemIndex = state.items.findIndex(i => i.variantId === item.variantId);

                    if (existingItemIndex >= 0) {
                        // Item exists, update quantity
                        const updatedItems = [...state.items];
                        const newQty = updatedItems[existingItemIndex].qty + qty;

                        // Respect stock limits if possible
                        updatedItems[existingItemIndex].qty = Math.min(newQty, item.stockOnHand);

                        return { items: updatedItems, isDrawerOpen: true };
                    } else {
                        // New item
                        return {
                            items: [...state.items, { ...item, qty: Math.min(qty, item.stockOnHand) }],
                            isDrawerOpen: true
                        };
                    }
                });
            },

            removeItem: (variantId) => {
                set((state) => ({
                    items: state.items.filter(i => i.variantId !== variantId)
                }));
            },

            updateQty: (variantId, qty) => {
                set((state) => ({
                    items: state.items.map(item => {
                        if (item.variantId === variantId) {
                            return { ...item, qty: Math.min(Math.max(1, qty), item.stockOnHand) };
                        }
                        return item;
                    })
                }));
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () => {
                return get().items.reduce((total, item) => total + (item.salePrice * item.qty), 0);
            },

            getCartCount: () => {
                return get().items.reduce((count, item) => count + item.qty, 0);
            }
        }),
        {
            name: 'neary-cart-storage',
            // Only persist items, not UI state like isDrawerOpen
            partialize: (state) => ({ items: state.items }),
        }
    )
);
