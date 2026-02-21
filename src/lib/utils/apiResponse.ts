import { NextResponse } from "next/server";

export type ApiResponse<T = any> = {
    success: boolean;
    data: T | null;
    error: string | null;
};

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
    return NextResponse.json({ success: true, data, error: null }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse<null>> {
    return NextResponse.json({ success: false, data: null, error }, { status });
}

// Higher order function for route handlers to catch errors
export function withErrorHandler(handler: (req: Request, context: any) => Promise<NextResponse>) {
    return async (req: Request, context: any) => {
        try {
            return await handler(req, context);
        } catch (error: any) {
            console.error("[API Error]", error);
            return errorResponse(error.message || "Internal server error", 500);
        }
    };
}
