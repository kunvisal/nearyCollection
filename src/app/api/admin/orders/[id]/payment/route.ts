import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/orderService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

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
            return NextResponse.json({ error: "Payment status is required" }, { status: 400 });
        }

        const updated = await OrderService.updatePaymentStatus(id, status);
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to update payment status" },
            { status: 500 }
        );
    }
}
