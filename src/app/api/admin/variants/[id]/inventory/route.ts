import { NextRequest, NextResponse } from "next/server";
import { InventoryRepository } from "@/lib/repositories/inventoryRepository";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "STAFF")) {
            return errorResponse("Unauthorized", 401);
        }

        const params = await context.params;
        const transactions = await InventoryRepository.findByVariantId(params.id);
        return successResponse(transactions);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
