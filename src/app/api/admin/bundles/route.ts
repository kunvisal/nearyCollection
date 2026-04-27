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

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!isAuthorized(session)) return errorResponse("Unauthorized", 401);

        const bundles = await BundleService.getAllBundles();
        const enriched = await Promise.all(
            bundles.map(async (b) => ({
                ...b,
                availableQty: await BundleRepository.computeAvailableQty(b.id),
                suggestedUnitPrice: BundleService.suggestUnitPrice(
                    b.bundleComponents.map((c) => ({
                        salePrice: c.variant.salePrice,
                        qty: c.qty,
                    })),
                    b.bundleDiscount != null ? Number(b.bundleDiscount) : null,
                ),
            })),
        );
        return successResponse(enriched);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal error";
        return errorResponse(msg, 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAuthorized(session)) return errorResponse("Unauthorized", 401);

        const body = await req.json();
        const bundle = await BundleService.createBundle(body);
        revalidatePath("/", "layout");
        return successResponse(bundle, 201);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return errorResponse(
                "Validation Error: " + error.issues.map((e) => e.message).join(", "),
                400,
            );
        }
        const msg = error instanceof Error ? error.message : "Internal error";
        return errorResponse(msg, 500);
    }
}
