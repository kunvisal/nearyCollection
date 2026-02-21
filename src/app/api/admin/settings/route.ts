import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/lib/services/settingsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { updateSettingsSchema } from "@/lib/validators/settingsValidators";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await SettingsService.getSettings();
        return NextResponse.json({ data: settings });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = updateSettingsSchema.parse(body);

        const updatedSettings = await SettingsService.updateSettings(validatedData as any);
        return NextResponse.json({ data: updatedSettings, success: true });
    } catch (error: any) {
        console.error("Update settings error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update settings" },
            { status: 400 }
        );
    }
}
