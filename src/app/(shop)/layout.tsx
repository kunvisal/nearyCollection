import BottomNav from "@/components/Shop/BottomNav/BottomNav";
import CartDrawer from "@/components/Shop/CartDrawer/CartDrawer";
import React from "react";

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="w-full md:max-w-3xl lg:max-w-6xl mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
                {children}
            </main>

            <CartDrawer />

            <div className="w-full md:max-w-3xl lg:max-w-6xl mx-auto fixed bottom-0 left-0 right-0 z-50">
                <BottomNav />
            </div>
        </div>
    );
}
