import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/lib/services/categoryService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN" && (session.user as any).role !== "STAFF") {
            return errorResponse("Unauthorized", 401);
        }

        const categories = await CategoryService.gllAllCategories();
        return successResponse(categories);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN" && (session.user as any).role !== "STAFF") {
            return errorResponse("Unauthorized", 401);
        }

        const body = await req.json();
        const category = await CategoryService.createCategory(body);
        return successResponse(category, 201);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return errorResponse("Validation Error: " + error.issues.map((e: any) => e.message).join(", "), 400);
        }
        return errorResponse(error.message, 500);
    }
}
