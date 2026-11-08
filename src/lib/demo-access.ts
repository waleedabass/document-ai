import { cookies, headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";

export async function requireLiveAccess(): Promise<void> {
  const secret = process.env.PIXEL_LIVE_ACCESS_TOKEN ?? "";
  if (process.env.ENABLE_LIVE_DEMO !== "true" || !process.env.DATABASE_URL || secret.length < 32) {
    throw new Error("Live integration access is disabled. Use the public sample experience.");
  }
  const supplied = (await cookies()).get("pixel-live-access")?.value
    ?? (await headers()).get("authorization")?.replace(/^Bearer /, "") ?? "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Private integration access is required.");
  }
}
