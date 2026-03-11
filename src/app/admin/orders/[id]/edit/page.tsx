import EditOrderClient from "./EditOrderClient";
import { OrderService } from "@/lib/services/orderService";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold bg-white dark:bg-gray-900 text-red-500 p-8 rounded-2xl shadow-sm border border-red-100 dark:border-red-900">Unauthorized</h1>
                </div>
            </div>
        );
    }

    const order = await OrderService.getOrderById(id);

    if (!order) {
        notFound();
    }

    // Sanitize the Prisma object to remove Decimal instances which cannot cross the Server/Client boundary
    const plainOrder = JSON.parse(JSON.stringify(order));

    return <EditOrderClient order={plainOrder} />;
}
