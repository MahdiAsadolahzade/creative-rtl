import { describe, expect, it } from "vitest";
import { normalizeLatexDelimiters, normalizeMarkdown, normalizeSource, repairNestedFences } from "@/lib/markdown/normalize";

describe("markdown normalizers", () => {
  it("normalizes line endings and preserves directional marks", () => {
    expect(normalizeSource("\uFEFFسلام\u200C\r\n")).toBe("سلام\u200C\n");
  });
  it("converts ChatGPT latex delimiters", () => {
    expect(normalizeLatexDelimiters(String.raw`\[x^2\] و \(y\)`)).toBe("$$x^2$$ و $y$");
  });
  it("repairs nested fences", () => {
    const source = ["```markdown", "```js", "const x = 1", "```", "```"].join("\n");
    expect(repairNestedFences(source).split("\n")[1]).toContain("````");
  });
  it("normalizes Persian ordered list markers", () => {
    expect(normalizeMarkdown("۱. اول\n۲. دوم")).toBe("1. اول\n1. دوم");
  });
});
