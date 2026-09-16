import { NextRequest } from "next/server";
import { forwardBranding } from "@/lib/auth-server";
export function GET(request: NextRequest) { return forwardBranding(request, true); }
