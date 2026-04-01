import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { MessengerService } from "@/lib/services/messengerService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return errorResponse("Unauthorized", 401);

    const { recipientId, imageFile } = await req.json();
    if (!recipientId || !imageFile) return errorResponse("recipientId and imageFile are required", 400);

    // Use Supabase Storage public URL — accessible by Facebook in both dev and production.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/qr-codes/${imageFile}`;

    await MessengerService.sendImage(recipientId, imageUrl);
    return successResponse(null);
}
