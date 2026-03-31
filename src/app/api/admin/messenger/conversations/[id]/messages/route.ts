import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { MessengerService } from "@/lib/services/messengerService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "STAFF"].includes((session.user as { role: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const messages = await MessengerService.getConversationMessages(id);
        const { phone } = MessengerService.parseCustomerInfo(messages);

        return successResponse({ messages, phone });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch messages";
        return errorResponse(message, 500);
    }
}
