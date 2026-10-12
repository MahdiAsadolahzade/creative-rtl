"use client";

import { Bold, Code, Heading2, Highlighter, Italic, Link, List, ListOrdered, Minus, Quote, SquareCode, Strikethrough, Table, type LucideIcon } from "lucide-react";
import type { EditorView } from "@codemirror/view";
import { applyFormat, type FormatAction } from "./format";

type ToolbarItem = { action: FormatAction; label: string; shortcut?: string; icon: LucideIcon };

const groups: ToolbarItem[][] = [
  [
    { action: "bold", label: "پررنگ",shortcut: "Ctrl+B", icon: Bold },
    { action: "italic", label: "مورب", shortcut: "Ctrl+I", icon: Italic },
    { action: "strike", label: "خط‌خورده", icon: Strikethrough },
    { action: "highlight", label: "هایلایت", shortcut: "Ctrl+Shift+H", icon: Highlighter },
    { action: "code", label: "کد درون‌خطی", shortcut: "Ctrl+E", icon: Code },
    { action: "link", label: "لینک", shortcut: "Ctrl+K", icon: Link },
  ],
  [
    { action: "heading", label: "تیتر", icon: Heading2 },
    { action: "bullet", label: "فهرست نقطه‌ای", icon: List },
    { action: "numbered", label: "فهرست شماره‌دار", icon: ListOrdered },
    { action: "quote", label: "نقل‌قول", icon: Quote },
  ],
  [
    { action: "codeBlock", label: "بلوک کد", icon: SquareCode },
    { action: "table", label: "جدول", icon: Table },
    { action: "rule", label: "خط جداکننده", icon: Minus },
  ],
];

type FormatToolbarProps = { viewRef: { current: EditorView | null } };

export function FormatToolbar({ viewRef }: FormatToolbarProps) {
  return (
    <div className="format-toolbar" role="toolbar" aria-label="قالب‌بندی Markdown">
      {groups.map((group, index) => (
        <div className="format-toolbar__group" key={index}>
          {group.map((item) => {
            const Icon = item.icon;
            const title = item.shortcut ? `${item.label} (${item.shortcut})` : item.label;
            return (
              <button
                key={item.action}
                type="button"
                className="format-button"
                title={title}
                aria-label={title}
                // Keeps the text selection and focus in the editor while the button is pressed.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const view = viewRef.current;
                  if (!view) return;
                  applyFormat(view, item.action);
                  view.focus();
                }}
              >
                <Icon size={16} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
