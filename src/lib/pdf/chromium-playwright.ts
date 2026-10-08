import { chromium, type Browser } from "playwright";
import type { PdfEngine, PdfRenderOptions } from "./engine";

const allowedPageSchemes = new Set(["about:", "blob:", "data:"]);

function canLoad(url: string): boolean {
  try {
    return allowedPageSchemes.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export const playwrightPdfEngine: PdfEngine = {
  async render(html, options) {
    let browser: Browser | undefined;
    try {
      const args = process.env.PDF_NO_SANDBOX === "1" ? ["--no-sandbox"] : [];
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args,
      });
      const context = await browser.newContext({
        viewport: { width: options.format === "png" ? 800 : 794, height: 1123 },
        javaScriptEnabled: options.javaScriptEnabled ?? true,
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      await page.route("**/*", async (route) => {
        if (canLoad(route.request().url())) await route.continue();
        else await route.abort("blockedbyclient");
      });
      await page.setContent(html, { waitUntil: "load", timeout: options.timeoutMs ?? 20_000 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        if (document.fonts.load) await document.fonts.load("16px Peyda Export");
      });
      if (options.javaScriptEnabled !== false) {
        await page.waitForFunction(() => (window as Window & { __READY__?: boolean }).__READY__ === true, null, {
          timeout: options.timeoutMs ?? 20_000,
        });
      }
      if (options.format === "png") {
        return await page.screenshot({ type: "png", fullPage: true });
      }
      return await page.pdf({
        format: options.pageSize ?? "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await browser?.close();
    }
  },
};
