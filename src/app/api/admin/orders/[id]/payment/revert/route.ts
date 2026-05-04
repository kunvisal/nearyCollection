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
        const sessionUser = session?.user as { id?: string; name?: string; role?: string } | undefined;
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Only admins can revert a paid order to unpaid." }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const reason = typeof body?.reason === "string" ? body.reason : "";

        const updated = await OrderService.revertPaymentToUnpaid(id, reason, {
            userId: sessionUser.id ?? "unknown",
            name: sessionUser.name ?? "unknown",
        });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to revert payment";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
