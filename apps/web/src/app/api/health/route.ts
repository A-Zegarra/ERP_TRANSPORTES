export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "larams-web", phase: 0 }, {
    headers: { "Cache-Control": "no-store" },
  });
}
