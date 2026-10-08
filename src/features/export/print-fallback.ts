"use client";

function stylesheetMarkup(): string {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return `<style>${Array.from(sheet.cssRules).map((rule) => rule.cssText).join("")}</style>`;
    } catch {
      return sheet.href ? `<link rel="stylesheet" href="${sheet.href}">` : "";
    }
  }).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function printPreview(preview: HTMLElement, title: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.className = "export-print-frame";
    iframe.setAttribute("title", "پیش‌نمایش چاپ");
    iframe.style.position = "fixed";
    iframe.style.inset = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    const clone = preview.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".block-menu, .block-menu-popover, button, .sr-only").forEach((element) => element.remove());
    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        iframe.remove();
        resolve();
        return;
      }
      const cleanup = () => {
        iframe.remove();
        resolve();
      };
      frameWindow.addEventListener("afterprint", cleanup, { once: true });
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(cleanup, 10_000);
    };
    document.body.append(iframe);
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      iframe.remove();
      resolve();
      return;
    }
    frameDocument.open();
    frameDocument.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${stylesheetMarkup()}</head><body>${clone.outerHTML}</body></html>`);
    frameDocument.close();
  });
}
