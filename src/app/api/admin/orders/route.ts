import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/orderService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status") || undefined;
        const paymentStatus = searchParams.get("paymentStatus") || undefined;
        const searchTerm = searchParams.get("search") || undefined;

        const result = await OrderService.getOrders({
            page,
            limit,
            status: status as any,
            paymentStatus: paymentStatus as any,
            searchTerm,
        });

        return NextResponse.json({
            data: result.orders,
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            }
        });
    } catch (error: any) {
        console.error("API Error fetching orders:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
