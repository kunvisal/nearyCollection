import { NextRequest, NextResponse } from "next/server";
import { TelegramService } from "@/lib/services/telegramService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const success = await TelegramService.sendMessage(
            "🔔 <b>Test Alert System</b>\n\nYour Telegram integration for Neary Collection is working correctly!",
            "HTML"
        );

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: "Failed to send message. Please check token and chat ID." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to test telegram" },
            { status: 500 }
        );
    }
}
