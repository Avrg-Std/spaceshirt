import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await createSessionToken();
    const cookieOptions = getSessionCookieOptions();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieOptions.name, token, cookieOptions);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
