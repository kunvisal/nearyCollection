import { NextRequest, NextResponse } from "next/server";
import { ImageService } from "@/lib/services/imageService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

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
        await ImageService.deleteImage(params.id);
        return successResponse({ deleted: true });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
