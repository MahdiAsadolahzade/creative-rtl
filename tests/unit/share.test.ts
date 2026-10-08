import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "@/features/share/encode";

describe("share payload", () => {
  it("round trips unicode, emoji and ZWNJ", async () => {
    const payload = { s: "سلام می‌خواهم Hello 👋", m: "markdown" as const, d: "auto" as const };
    const encoded = await encodeShare(payload);
    expect(encoded.startsWith("v1.")).toBe(true);
    expect(await decodeShare(encoded)).toEqual(payload);
  });
  it("rejects invalid payloads", async () => {
    expect(await decodeShare("bad")).toBeNull();
  });
});
