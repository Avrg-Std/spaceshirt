import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/admin-session";

export async function POST() {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieOptions.name, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
