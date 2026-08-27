import "server-only";

import { cookies } from "next/headers";
import {
  getAdminCookieName,
  verifySessionToken,
} from "@/lib/admin-session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    throw new AdminAuthError("Unauthorized");
  }
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}
