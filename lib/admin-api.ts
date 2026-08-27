import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminSession } from "@/lib/admin-auth";

export function adminErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function withAdminAuth(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await requireAdminSession();
    return await handler();
  } catch (error) {
    return adminErrorResponse(error, "Request failed");
  }
}
