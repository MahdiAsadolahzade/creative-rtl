"use client";

import { useEffect, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clipboard, Download, Image, LoaderCircle, Link2, MoreHorizontal, X } from "lucide-react";
import { copyPreview } from "./copy-preview";
import { useExport, type ExportSettings } from "./useExport";

type ExportActionsProps = {
  settings: ExportSettings;
  previewRef: RefObject<HTMLElement | null>;
  onCopyShare: () => Promise<void>;
  onMessage: (message: string, tone?: "success" | "error") => void;
};

function errorMessage(code: string): string {
  if (code === "rate_limited") return "چند ثانیه صبر کنید و دوباره تلاش کنید.";
  if (code === "payload_too_large" || code === "export_too_large") return "متن برای خروجی خیلی بزرگ است.";
  if (code === "export_unavailable" || code === "export_failed" || code === "export_timeout") return "ساخت PDF در دسترس نیست؛ چاپ مرورگر را امتحان کنید.";
  return "ساخت خروجی انجام نشد.";
}

export function ExportActions({ settings, previewRef, onCopyShare, onMessage }: ExportActionsProps) {
  const { status, start, cancel } = useExport();
  const working = status === "working";

  const download = async (format: "pdf" | "png") => {
    const ok = await start(format, settings);
    if (ok) {
      onMessage(format === "pdf" ? "PDF آماده شد." : "تصویر آماده شد.", "success");
    } else if (typeof ok === "string") {
      onMessage(errorMessage(ok), "error");
      if (format === "pdf" && ok !== "rate_limited" && ok !== "payload_too_large" && ok !== "export_too_large") {
        const { printPreview } = await import("./print-fallback");
        if (previewRef.current) await printPreview(previewRef.current, settings.title ?? "creative-rtl");
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (!working) void download("pdf");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [working, settings]);

  const copy = async () => {
    if (!previewRef.current) return;
    try {
      await copyPreview(previewRef.current, settings.source);
      onMessage("پیش‌نمایش کپی شد.", "success");
    } catch {
      onMessage("کپی پیش‌نمایش انجام نشد.", "error");
    }
  };

  return (
    <div className="export-actions">
      <button
        type="button"
        className="export-pdf-button"
        aria-busy={working}
        onClick={() => (working ? cancel() : void download("pdf"))}
        aria-label={working ? "لغو ساخت PDF" : "دانلود PDF"}
      >
        {working ? <><LoaderCircle className="is-spinning" size={16} /> <span>در حال ساخت PDF…</span><X size={14} /></> : <><Download size={16} /><span>دانلود PDF</span></>}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="export-more-button" aria-label="گزینه‌های خروجی">
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="export-menu" sideOffset={6} align="end" style={{ direction: "rtl" }}>
            <DropdownMenu.Item onSelect={() => void download("png")}><Image size={16} /> دانلود تصویر (PNG)</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => void copy()}><Clipboard size={16} /> <span title="برای خروجی دقیق‌تر از PDF یا تصویر استفاده کنید">کپی پیش‌نمایش</span></DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => void onCopyShare()}><Link2 size={16} /> کپی لینک اشتراک</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
