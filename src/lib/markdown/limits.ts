const MAX_BODY_BYTES = 256 * 1024;
const MAX_BLOCKS = 2000;
const MAX_MERMAID = 20;
const buckets = new Map<string, number[]>();

export function isWithinBodyLimit(value: string): boolean {
  return new TextEncoder().encode(value).byteLength <= MAX_BODY_BYTES;
}

export function validateContentLimits(source: string): string | null {
  if (!isWithinBodyLimit(source)) return "413";
  if (source.split(/\n{2,}/u).length > MAX_BLOCKS) return "413";
  if ((source.match(/```mermaid\b/gi) ?? []).length > MAX_MERMAID) return "413";
  return null;
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(ip) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  buckets.set(ip, recent);
  return recent.length > 60;
}
