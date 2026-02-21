import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/orderService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await OrderService.getOrderById(id);

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch order details" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const updatedOrder = await OrderService.updateOrderStatus(id, status);

        return NextResponse.json({ data: updatedOrder, success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to update order status" },
            { status: 500 }
        );
    }
}
