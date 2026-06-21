import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "./auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function requireAdminFromRequest(request: NextRequest): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
