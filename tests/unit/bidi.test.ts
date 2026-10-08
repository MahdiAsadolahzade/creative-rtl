import { describe, expect, it } from "vitest";
import { resolveBlockDir, documentDirection } from "@/lib/bidi/direction";
import { isolateRuns } from "@/lib/bidi/isolate";

describe("bidi direction", () => {
  it.each([
    ["سلام دنیا", "rtl"],
    ["Hello world", "ltr"],
    ["این یک test است", "rtl"],
    ["Use Docker برای deploy", "ltr"],
    ["برای deploy از Docker و Kubernetes استفاده کنید", "rtl"],
    ["Docker برای deploy از Kubernetes استفاده کنید", "rtl"],
  ])("%s → %s", (text, expected) => {
    expect(resolveBlockDir(text, "rtl")).toBe(expected);
  });
  it("uses context for short or ambiguous blocks", () => {
    expect(resolveBlockDir("API", "rtl")).toBe("rtl");
    expect(resolveBlockDir("1234 + ۵۶", "ltr")).toBe("ltr");
    expect(resolveBlockDir("Docker برای deploy از Kubernetes استفاده کنید", "ltr")).toBe("ltr");
  });
  it("reports a mixed document", () => {
    expect(documentDirection("سلام دنیا Hello")).toMatchObject({ dominant: "rtl", mixed: true });
  });
});

describe("bidi isolation", () => {
  it("isolates Latin runs in RTL", () => {
    expect(isolateRuns("با Docker.", "rtl")).toBe("با <bdi dir=\"ltr\">Docker</bdi>.");
  });
  it("keeps ZWNJ", () => {
    expect(isolateRuns("می‌خواهم", "rtl")).toContain("می‌خواهم");
  });
  it("keeps separate runs", () => {
    const result = isolateRuns("از C++ و Node.js استفاده کن", "rtl");
    expect(result.match(/<bdi dir="ltr">/g)).toHaveLength(2);
  });
  it("keeps adjacent opposite-direction words in one run", () => {
    expect(isolateRuns("This is a test with English", "rtl")).toBe(
      '<bdi dir="ltr">This is a test with English</bdi>',
    );
    expect(isolateRuns("از Hello world استفاده کن", "rtl")).toBe(
      'از <bdi dir="ltr">Hello world</bdi> استفاده کن',
    );
  });
  it("keeps grouping punctuation around a run", () => {
    expect(isolateRuns("نسخه (Node.js 20) نصب شد", "rtl")).toContain(
      '<bdi dir="ltr">(Node.js 20)</bdi>',
    );
  });
});
