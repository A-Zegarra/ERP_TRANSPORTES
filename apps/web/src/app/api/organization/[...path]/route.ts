import { NextRequest } from "next/server";
import { forwardOrganization } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, context: Context) {
  return forwardOrganization(request, (await context.params).path);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
