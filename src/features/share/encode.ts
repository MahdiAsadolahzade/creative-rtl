export type SharePayload = { s: string; m: "markdown" | "html"; d: "auto" | "rtl" | "ltr"; p?: string };

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function transform(data: Uint8Array, format: "deflate-raw" | "identity"): Promise<Uint8Array> {
  if (format === "identity" || typeof CompressionStream === "undefined") return data;
  const stream = new CompressionStream(format);
  const writer = stream.writable.getWriter();
  await writer.write(data as unknown as BufferSource);
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await transform(data, "deflate-raw");
  return `v1.${bytesToBase64Url(compressed)}`;
}

export async function decodeShare(value: string): Promise<SharePayload | null> {
  if (!value.startsWith("v1.")) return null;
  try {
    const bytes = base64UrlToBytes(value.slice(3));
    let data = bytes;
    if (typeof DecompressionStream !== "undefined") {
      const stream = new DecompressionStream("deflate-raw");
      const writer = stream.writable.getWriter();
      await writer.write(bytes as unknown as BufferSource);
      await writer.close();
      data = new Uint8Array(await new Response(stream.readable).arrayBuffer());
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(data));
    if (typeof parsed !== "object" || parsed === null) return null;
    const valueObject = parsed as Record<string, unknown>;
    if (typeof valueObject.s !== "string" || !["markdown", "html"].includes(String(valueObject.m)) || !["auto", "rtl", "ltr"].includes(String(valueObject.d))) return null;
    return { s: valueObject.s, m: valueObject.m as SharePayload["m"], d: valueObject.d as SharePayload["d"], p: typeof valueObject.p === "string" ? valueObject.p : undefined };
  } catch {
    return null;
  }
}
