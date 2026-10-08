import { describe, expect, it } from "vitest";
import { buildExportDocument } from "@/lib/export/document";
import { exportFilename } from "@/lib/export/filename";
import { validateExportLimits } from "@/lib/export/limits";

describe("export document", () => {
  it("builds a self-contained RTL document without trusting source HTML", () => {
    const html = buildExportDocument({
      blocks: [{
        id: "one",
        kind: "mermaid",
        dir: "rtl",
        html: "<script>alert(1)</script>",
        line: 1,
        mermaid: { source: "<script>alert(1)</script>" },
      }],
      paper: "warm",
      dir: "rtl",
      title: "سلام، Hello",
      pageSize: "Letter",
      css: ".paper{color:red}",
      fontCss: "@font-face{}",
      mermaidScript: "window.__READY__=true",
    });
    expect(html).toContain('<html lang="fa" dir="rtl">');
    expect(html).toContain('data-paper="warm"');
    expect(html).toContain("data-mermaid-src=\"&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("@font-face");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("script-src");
    expect(html).toContain("@page{size:Letter;}");
    expect(html.indexOf("<main")).toBeLessThan(html.indexOf("<script>"));
  });

  it("creates stable filenames and rejects oversized export input", () => {
    expect(exportFilename("سلام، سند اول", "pdf")).toBe("سلام-سند-اول.pdf");
    expect(validateExportLimits("a".repeat(257 * 1024))).toBe("payload_too_large");
  });
});
