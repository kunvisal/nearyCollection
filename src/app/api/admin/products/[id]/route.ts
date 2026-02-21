import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/productService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { z } from "zod";
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
        const product = await ProductService.getProductById(params.id);
        return successResponse(product);
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes("not found") ? 404 : 500);
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "STAFF")) {
            return errorResponse("Unauthorized", 401);
        }

        const params = await context.params;
        const body = await req.json();
        const product = await ProductService.updateProduct(params.id, body);
        return successResponse(product);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return errorResponse("Validation Error: " + error.issues.map((e: any) => e.message).join(", "), 400);
        }
        return errorResponse(error.message, error.message.includes("not found") ? 404 : 500);
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "STAFF")) {
            return errorResponse("Unauthorized", 401);
        }

        const params = await context.params;
        await ProductService.deleteProduct(params.id);
        return successResponse({ deleted: true });
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes("not found") ? 404 : 500);
    }
}
