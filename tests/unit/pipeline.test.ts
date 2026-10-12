import { readFileSync } from "node:fs";
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

  it("wraps tables for horizontal scrolling and keeps GFM column alignment", async () => {
    const result = await renderDocument({
      source: "| نام | مقدار |\n| :--- | :---: |\n| علی | ۲۰ |",
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain('<div class="table-wrap" dir="rtl"><table');
    expect(html).toContain('align="center"');
    expect(result.blocks[0]?.line).toBe(1);
  });

  it("reports math and nested markdown features from the rendered tree", async () => {
    const math = await renderDocument({ source: "$$x^2$$", mode: "markdown", dir: "auto" });
    expect(math.meta.features.math).toBe(true);
    const nested = await renderDocument({ source: "```markdown\n# hi\n```", mode: "markdown", dir: "auto" });
    expect(nested.meta.features.nestedMarkdown).toBe(true);
  });

  it("turns ==text== into mark but leaves inline code alone", async () => {
    const result = await renderDocument({
      source: "این ==مهم== است و `==کد==` نیست. English ==mark== here",
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain("<mark>مهم</mark>");
    expect(html).toContain('<mark><bdi dir="ltr">mark</bdi></mark>');
    expect(html).toContain('<code dir="ltr">==کد==</code>');
  });

  it("keeps footnote ids and hrefs prefixed once and uses Persian labels", async () => {
    const result = await renderDocument({
      source: "متن[^1]\n\n[^1]: یادداشت",
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html).toContain('href="#user-content-fn-1"');
    expect(html).toContain('id="user-content-fn-1"');
    expect(html).not.toContain("user-content-user-content");
    expect(html).toContain("پانویس‌ها");
  });

  it("renders the table fixture as a wrapped table", async () => {
    const result = await renderDocument({
      source: readFileSync("tests/fixtures/tables-mixed.md", "utf8"),
      mode: "markdown",
      dir: "auto",
    });
    const html = result.blocks.map((block) => block.html).join("");
    expect(html.match(/<table/g)).toHaveLength(1);
    expect(html).toContain('class="table-wrap"');
    expect(result.meta.warnings).toEqual([]);
  });

  it("warns when a Markdown table is pasted into HTML mode", async () => {
    const source = "| a | b |\n| --- | --- |\n| 1 | 2 |";
    const html = await renderDocument({ source, mode: "html", dir: "auto" });
    expect(html.meta.warnings).toEqual(["markdown-in-html"]);
    const markdown = await renderDocument({ source, mode: "markdown", dir: "auto" });
    expect(markdown.meta.warnings).toEqual([]);
  });
});
