import "server-only";

import type { PdfEngine } from "./engine";

export async function getPdfEngine(): Promise<PdfEngine | null> {
  if (process.env.PDF_ENGINE === "disabled") return null;
  if (process.env.VERCEL === "1" && process.env.PDF_ENGINE === undefined) return null;
  if (process.env.PDF_ENGINE === "playwright" || process.env.PDF_ENGINE === undefined) {
    const { playwrightPdfEngine } = await import("./chromium-playwright");
    return playwrightPdfEngine;
  }
  return null;
}
