import { z } from "zod";
import { renderDocument } from "@/lib/markdown/pipeline";
import { contentTitle, exportFilename } from "@/lib/export/filename";
import { getExportAssets } from "@/lib/export/assets";
import { acquireExportSlot, isExportRateLimited, validateExportLimits } from "@/lib/export/limits";
import { buildExportDocument } from "@/lib/export/document";
import { inlineRemoteImages } from "@/lib/export/remote-images";
import { getPdfEngine } from "@/lib/pdf";

export const maxDuration = 30;

const requestSchema = z.object({
  source: z.string(),
  mode: z.enum(["markdown", "html"]),
  dir: z.enum(["auto", "rtl", "ltr"]),
  softBreaks: z.enum(["markdown", "preserve"]).optional(),
  nestedMarkdown: z.enum(["preview", "source"]).optional(),
  paper: z.enum(["white", "warm", "dark"]),
  format: z.enum(["pdf", "png"]),
  pageSize: z.enum(["A4", "Letter"]).optional(),
  title: z.string().optional(),
});

const baseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(error: string, status: number, extra: Record<string, string> = {}): Response {
  return Response.json({ error }, { status, headers: { ...baseHeaders, ...extra } });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 256 * 1024) return errorResponse("payload_too_large", 413);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isExportRateLimited(ip)) return errorResponse("rate_limited", 429, { "Retry-After": "60" });
  const release = acquireExportSlot();
  if (!release) return errorResponse("export_busy", 503, { "Retry-After": "5" });

  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return errorResponse("invalid_request", 400);
    const limitError = validateExportLimits(parsed.data.source);
    if (limitError) return errorResponse(limitError, 413);

    const engine = await getPdfEngine();
    if (!engine) return errorResponse("export_unavailable", 503);
    const rendered = await renderDocument({
      source: parsed.data.source,
      mode: parsed.data.mode,
      dir: parsed.data.dir,
      softBreaks: parsed.data.softBreaks,
      nestedMarkdown: parsed.data.nestedMarkdown,
    });
    const blocks = await inlineRemoteImages(rendered.blocks);
    const title = contentTitle(parsed.data.title ?? rendered.meta.headings.find((heading) => heading.depth === 1)?.text);
    const assets = await getExportAssets();
    const documentDir = parsed.data.dir === "auto"
      ? (rendered.meta.direction.dominant === "ltr" ? "ltr" : "rtl")
      : parsed.data.dir;
    const document = buildExportDocument({
      blocks,
      paper: parsed.data.paper,
      dir: documentDir,
      title,
      pageSize: parsed.data.pageSize,
      css: assets.css,
      fontCss: assets.fontCss,
      mermaidScript: rendered.meta.features.mermaid ? assets.mermaidScript : "",
    });
    const output = await engine.render(document, {
      format: parsed.data.format,
      pageSize: parsed.data.pageSize,
      javaScriptEnabled: rendered.meta.features.mermaid,
      timeoutMs: 20_000,
    });
    const filename = exportFilename(title, parsed.data.format);
    const asciiFilename = `creative-rtl.${parsed.data.format}`;
    const contentType = parsed.data.format === "pdf" ? "application/pdf" : "image/png";
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": contentType,
        "Content-Length": String(output.byteLength),
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return error instanceof Error && /timeout|timed out/u.test(message)
      ? errorResponse("export_timeout", 504)
      : errorResponse("export_failed", 500);
  } finally {
    release();
  }
}
