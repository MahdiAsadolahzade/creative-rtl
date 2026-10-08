"use client";

import { useCallback, useRef, useState } from "react";

export type ExportStatus = "idle" | "working" | "error";
export type ExportFormat = "pdf" | "png";

export type ExportSettings = {
  source: string;
  mode: "markdown" | "html";
  dir: "auto" | "rtl" | "ltr";
  softBreaks: "markdown" | "preserve";
  nestedMarkdown: "preview" | "source";
  paper: "white" | "warm" | "dark";
  pageSize: "A4" | "Letter";
  title?: string;
};

function responseFilename(response: Response, fallback: string): string {
  const header = response.headers.get("content-disposition") ?? "";
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/iu)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return fallback;
    }
  }
  return header.match(/filename="([^"]+)"/iu)?.[1] ?? fallback;
}

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async (format: ExportFormat, settings: ExportSettings): Promise<boolean | string> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("working");
    setError("");
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, format }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "export_failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = responseFilename(response, `creative-rtl.${format}`);
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus("idle");
      controllerRef.current = null;
      return true;
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return false;
      const code = reason instanceof Error ? reason.message : "export_failed";
      setError(code);
      setStatus("error");
      controllerRef.current = null;
      return code;
    }
  }, []);

  return { status, error, start, cancel };
}
