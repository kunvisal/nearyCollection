import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { MessengerService } from "@/lib/services/messengerService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return errorResponse("Unauthorized", 401);

    const { recipientId, message } = await req.json();
    if (!recipientId || !message) return errorResponse("recipientId and message are required", 400);

    await MessengerService.sendMessage(recipientId, message);
    return successResponse(null);
}
