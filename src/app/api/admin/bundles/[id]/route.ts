import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/authOptions";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { BundleService } from "@/lib/services/bundleService";
import { BundleRepository } from "@/lib/repositories/bundleRepository";

function isAuthorized(session: unknown) {
    const role = (session as { user?: { role?: string } } | null)?.user?.role;
    return role === "ADMIN" || role === "STAFF";
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAuthorized(session)) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const bundle = await BundleService.getBundleById(id);
        const availableQty = await BundleRepository.computeAvailableQty(id);
        const suggestedUnitPrice = BundleService.suggestUnitPrice(
            bundle.bundleComponents.map((c) => ({
                salePrice: c.variant.salePrice,
                qty: c.qty,
            })),
            bundle.bundleDiscount != null ? Number(bundle.bundleDiscount) : null,
        );
        return successResponse({ ...bundle, availableQty, suggestedUnitPrice });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal error";
        const status = msg.includes("not found") ? 404 : 500;
        return errorResponse(msg, status);
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAuthorized(session)) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const body = await req.json();
        const bundle = await BundleService.updateBundle(id, body);
        revalidatePath("/", "layout");
        return successResponse(bundle);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return errorResponse(
                "Validation Error: " + error.issues.map((e) => e.message).join(", "),
                400,
            );
        }
        const msg = error instanceof Error ? error.message : "Internal error";
        const status = msg.includes("not found") ? 404 : 500;
        return errorResponse(msg, status);
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAuthorized(session)) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        await BundleService.deleteBundle(id);
        revalidatePath("/", "layout");
        return successResponse({ deleted: true });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal error";
        const status = msg.includes("not found") ? 404 : 500;
        return errorResponse(msg, status);
    }
}
