import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { MessengerService } from "@/lib/services/messengerService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "STAFF"].includes((session.user as { role: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversations = await MessengerService.getRecentConversations();
        return successResponse(conversations);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch conversations";
        return errorResponse(message, 500);
    }
}
