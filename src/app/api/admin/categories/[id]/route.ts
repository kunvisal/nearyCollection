import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/lib/services/categoryService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";

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
        const id = parseInt(params.id);
        if (isNaN(id)) return errorResponse("Invalid ID", 400);

        const category = await CategoryService.getCategoryById(id);
        return successResponse(category);
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
        const id = parseInt(params.id);
        if (isNaN(id)) return errorResponse("Invalid ID", 400);

        const body = await req.json();
        const category = await CategoryService.updateCategory(id, body);
        revalidatePath("/", "layout");
        return successResponse(category);
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
        const id = parseInt(params.id);
        if (isNaN(id)) return errorResponse("Invalid ID", 400);

        await CategoryService.deleteCategory(id);
        revalidatePath("/", "layout");
        return successResponse({ deleted: true });
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes("not found") ? 404 : 500);
    }
}
