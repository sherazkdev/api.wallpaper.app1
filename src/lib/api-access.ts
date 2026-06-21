import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, checkRateLimit, trackApiRequest, ensureAppSettings } from "@/lib/api-key";
import { getAdminSession } from "@/lib/auth";

export async function validateApiAccess(
  request: NextRequest,
  trackRequest = true
): Promise<NextResponse | null> {
  await ensureAppSettings();

  const session = await getAdminSession();
  if (session) return null;

  const apiKey = request.headers.get("x-api-key");
  const isValid = await validateApiKey(apiKey);

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  if (trackRequest) {
    const withinLimit = await checkRateLimit();
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded" },
        { status: 429 }
      );
    }
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    trackApiRequest(request.nextUrl.pathname, request.method, ip || undefined);
  }

  return null;
}
