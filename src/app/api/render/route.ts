import { z } from "zod";
import { renderDocument } from "@/lib/markdown/pipeline";
import { isRateLimited, validateContentLimits } from "@/lib/markdown/limits";

const requestSchema = z.object({
  source: z.string(),
  mode: z.enum(["markdown", "html"]),
  dir: z.enum(["auto", "rtl", "ltr"]),
  softBreaks: z.enum(["markdown", "preserve"]).optional(),
  nestedMarkdown: z.enum(["preview", "source"]).optional(),
});

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 256 * 1024) return Response.json({ error: "payload_too_large" }, { status: 413, headers });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(ip)) return Response.json({ error: "rate_limited" }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const limitError = validateContentLimits(parsed.data.source);
    if (limitError) return Response.json({ error: "payload_too_large" }, { status: 413, headers });
    const result = await renderDocument(parsed.data);
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: "render_failed" }, { status: 500, headers });
  }
}
