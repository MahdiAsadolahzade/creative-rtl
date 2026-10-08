import { createHash } from "node:crypto";
import type { RenderBlock } from "@/lib/markdown/types";

export type ExportPaper = "white" | "warm" | "dark";

export type ExportDocumentOptions = {
  blocks: readonly RenderBlock[];
  paper: ExportPaper;
  dir: "rtl" | "ltr";
  title: string;
  pageSize?: "A4" | "Letter";
  lang?: string;
  css?: string;
  fontCss?: string;
  mermaidScript?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function blockHtml(block: RenderBlock): string {
  if (block.kind === "mermaid" && block.mermaid) {
    const source = escapeHtml(block.mermaid.source);
    return `<figure class="block block--mermaid mermaid-export" data-mermaid-src="${source}" data-block-id="${escapeHtml(block.id)}" dir="ltr"><pre dir="ltr"><code>${source}</code></pre></figure>`;
  }
  const safeHtml = block.html.replace(
    /<img\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/giu,
    '<span class="export-image-placeholder">تصویر خارجی در PDF قرار نمی‌گیرد</span>',
  );
  return `<div class="export-block" data-block-id="${escapeHtml(block.id)}" dir="${block.dir}">${safeHtml}</div>`;
}

export function buildExportDocument({
  blocks,
  paper,
  dir,
  title,
  pageSize = "A4",
  lang = "fa",
  css = "",
  fontCss = "",
  mermaidScript = "",
}: ExportDocumentOptions): string {
  const safeTitle = escapeHtml(title || "creative-rtl");
  const scripts = mermaidScript ? `<script>${mermaidScript}</script>` : "";
  const scriptPolicy = mermaidScript
    ? `script-src 'sha256-${createHash("sha256").update(mermaidScript).digest("base64")}'`
    : "script-src 'none'";
  const policy = `default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; ${scriptPolicy}; object-src 'none'; base-uri 'none'`;
  return `<!doctype html>
<html lang="${escapeHtml(lang)}" dir="${dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy)}">
    <title>${safeTitle}</title>
    <style>${fontCss}${css} @page{size:${pageSize};}</style>
  </head>
  <body data-paper="${paper}">
    <main class="paper print-root" data-paper="${paper}" dir="${dir}">${blocks.map(blockHtml).join("")}</main>
    ${scripts}
  </body>
</html>`;
}
