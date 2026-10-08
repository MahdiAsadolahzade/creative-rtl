import { isWithinBodyLimit, validateContentLimits } from "@/lib/markdown/limits";

const MAX_EXPORTS_PER_MINUTE = 10;
const MAX_CONCURRENT_EXPORTS = 2;
const MAX_ESTIMATED_PAGES = 20;
const requestBuckets = new Map<string, number[]>();
let activeExports = 0;

export function validateExportLimits(source: string): string | null {
  if (!isWithinBodyLimit(source)) return "payload_too_large";
  const renderError = validateContentLimits(source);
  if (renderError) return "payload_too_large";
  const estimatedLines = source.split("\n").length;
  if (estimatedLines > MAX_ESTIMATED_PAGES * 120) return "export_too_large";
  return null;
}

export function isExportRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestBuckets.get(ip) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  requestBuckets.set(ip, recent);
  return recent.length > MAX_EXPORTS_PER_MINUTE;
}

export function acquireExportSlot(): (() => void) | null {
  if (activeExports >= MAX_CONCURRENT_EXPORTS) return null;
  activeExports += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeExports = Math.max(0, activeExports - 1);
  };
}
