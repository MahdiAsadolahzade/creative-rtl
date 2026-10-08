import { describe, expect, it } from "vitest";
import { renderDocument } from "@/lib/markdown/pipeline";

describe("markdown pipeline polish regressions", () => {
  it("sets direction on nested prose blocks and isolates math", async () => {
    const result = await renderDocument({
      source: "> This is a test with English\n>\n> و فارسی\n\n- مورد فارسی\n- English item\n\nفرمول: $x^2 + y^2 = z^2$",
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain('<p dir="ltr">');
    expect(html).toMatch(/class="katex"[^>]*dir="ltr"/);
    expect(html).toContain('<li dir="rtl">');
  });

  it("removes unsafe data URLs while keeping safe image data", async () => {
    const result = await renderDocument({
      source: '<img src="data:text/html;base64,PHNjcmlwdD4="><img src="data:image/png;base64,AAAA">',
      mode: "html",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain("data:image/png;base64,AAAA");
  });

  it("keeps fenced code and marks Mermaid blocks", async () => {
    const result = await renderDocument({
      source: "```javascript\nconst value = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```",
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain("const");
    expect(result.meta.features.code).toBe(true);
    expect(result.meta.features.mermaid).toBe(true);
    expect(result.blocks.some((block) => block.kind === "mermaid")).toBe(true);
  });

  it("keeps safe HTML preview structure and inline styles without scripts", async () => {
    const result = await renderDocument({
      source: `<style>.card{color:red;background:url(https://bad.test/x)}</style><div class="card" style="color: blue"><audio controls><source src="https://example.com/a.mp3" type="audio/mpeg"></audio><strong>Preview</strong><script>alert(1)</script></div>`,
      mode: "html",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain('class="card"');
    expect(html).toContain('style="color: blue"');
    expect(html).toContain("<audio controls>");
    expect(html).not.toContain("alert");
    expect(html).not.toContain("url(");
  });
});
