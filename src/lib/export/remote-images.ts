import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { RenderBlock } from "@/lib/markdown/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const allowedTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split("%", 1)[0];
  if (isIP(normalized) === 4) {
    const octets = normalized.split(".").map(Number);
    const [first, second] = octets;
    return first === 10
      || first === 127
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || first === 0;
  }
  return normalized === "::1"
    || normalized === "::"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || normalized.startsWith("fe8")
    || normalized.startsWith("fe9")
    || normalized.startsWith("fea")
    || normalized.startsWith("feb")
    || normalized.startsWith("::ffff:10.")
    || normalized.startsWith("::ffff:192.168.")
    || normalized.startsWith("::ffff:127.");
}

async function assertSafeUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("unsafe_image_url");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("private_image_host");
  }
  return url;
}

async function readRemoteImage(value: string, total: { bytes: number }, redirectCount = 0): Promise<string> {
  const url = await assertSafeUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "creative-rtl-export/1.0" },
    });
    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= MAX_REDIRECTS) throw new Error("too_many_redirects");
      const location = response.headers.get("location");
      if (!location) throw new Error("invalid_redirect");
      return readRemoteImage(new URL(location, url).toString(), total, redirectCount + 1);
    }
    if (!response.ok) throw new Error("image_fetch_failed");
    const type = response.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase() ?? "";
    const announcedLength = Number(response.headers.get("content-length") ?? 0);
    if (!allowedTypes.has(type) || announcedLength > MAX_IMAGE_BYTES) throw new Error("image_type_or_size");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES || total.bytes + bytes.byteLength > MAX_TOTAL_BYTES) {
      throw new Error("image_size_limit");
    }
    total.bytes += bytes.byteLength;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}

export async function inlineRemoteImages(blocks: readonly RenderBlock[]): Promise<RenderBlock[]> {
  const total = { bytes: 0 };
  return Promise.all(blocks.map(async (block) => {
    if (block.kind !== "html" || !/<img\b/iu.test(block.html)) return block;
    const html = await replaceImages(block.html, total);
    return { ...block, html };
  }));
}

async function replaceImages(html: string, total: { bytes: number }): Promise<string> {
  const tags = [...html.matchAll(/<img\b[^>]*>/giu)];
  let output = html;
  for (const match of tags) {
    const tag = match[0];
    const source = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/iu)?.[1];
    if (!source || !/^https?:\/\//iu.test(source)) continue;
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/iu)?.[1] ?? "تصویر خارجی";
    try {
      const dataUrl = await readRemoteImage(source, total);
      output = output.replace(tag, tag.replace(source, dataUrl));
    } catch {
      output = output.replace(tag, `<span class="export-image-placeholder">${escapeText(alt)} — تصویر خارجی در PDF قرار نمی‌گیرد</span>`);
    }
  }
  return output;
}
