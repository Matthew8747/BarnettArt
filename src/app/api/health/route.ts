import { NextResponse } from "next/server";
import { limiters, clientIp } from "@/lib/rate-limit";

// Liveness probe. Returns no secrets and never touches the database, so it
// stays fast and safe to expose. Used by uptime monitors and CI smoke checks.
export async function GET(req: Request) {
  const { success } = await limiters.api.limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
