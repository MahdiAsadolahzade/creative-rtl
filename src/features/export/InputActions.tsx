"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Copy, Download, MoreHorizontal } from "lucide-react";

type InputActionsProps = {
  source: string;
  onMessage: (message: string, tone?: "success" | "error") => void;
};

export function InputActions({ source, onMessage }: InputActionsProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      onMessage("Markdown کپی شد.", "success");
    } catch {
      onMessage("کپی Markdown انجام نشد.", "error");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "creative-rtl.md";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    onMessage("فایل Markdown آماده شد.", "success");
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="panel-menu-trigger" aria-label="گزینه‌های ورودی">
          <MoreHorizontal size={17} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="export-menu" sideOffset={6} align="end" style={{ direction: "rtl" }}>
          <DropdownMenu.Item onSelect={() => void copy()}><Copy size={16} /> کپی Markdown</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={download}><Download size={16} /> دانلود Markdown</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
