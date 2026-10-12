import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";

export type FormatAction =
  | "bold"
  | "italic"
  | "strike"
  | "highlight"
  | "code"
  | "link"
  | "heading"
  | "bullet"
  | "numbered"
  | "quote"
  | "codeBlock"
  | "table"
  | "rule";

const wrapMarkers: Partial<Record<FormatAction, string>> = {
  bold: "**",
  italic: "*",
  strike: "~~",
  highlight: "==",
  code: "`",
};

const linePrefixPattern = /^(#{1,6}[ \t]+|[-*+][ \t]+|\d+\.[ \t]+|>[ \t]?)/u;

// Wraps the selection in a marker, or removes the marker when it is already there (toggle).
function toggleWrap(view: EditorView, marker: string): void {
  const { state } = view;
  const { from, to, empty } = state.selection.main;
  const size = marker.length;

  if (empty) {
    view.dispatch({ changes: { from, insert: marker + marker }, selection: EditorSelection.cursor(from + size) });
    return;
  }

  const selected = state.doc.sliceString(from, to);
  const before = state.doc.sliceString(Math.max(0, from - size), from);
  const after = state.doc.sliceString(to, Math.min(state.doc.length, to + size));

  if (selected.length >= size * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    view.dispatch({
      changes: [{ from, to: from + size }, { from: to - size, to }],
      selection: EditorSelection.range(from, to - size * 2),
    });
    return;
  }

  if (before === marker && after === marker) {
    view.dispatch({
      changes: [{ from: from - size, to: from }, { from: to, to: to + size }],
      selection: EditorSelection.range(from - size, to - size),
    });
    return;
  }

  view.dispatch({
    changes: [{ from, insert: marker }, { from: to, insert: marker }],
    selection: EditorSelection.range(from + size, to + size),
  });
}

// Adds or replaces the prefix on every selected line. Pressing the same action again removes it.
function setLinePrefix(view: EditorView, kind: "heading" | "bullet" | "numbered" | "quote"): void {
  const { state } = view;
  const { from, to } = state.selection.main;
  const first = state.doc.lineAt(from).number;
  const last = state.doc.lineAt(to).number;
  const changes: ChangeSpec[] = [];

  for (let number = first; number <= last; number++) {
    const line = state.doc.line(number);
    const index = number - first + 1;
    const existing = linePrefixPattern.exec(line.text)?.[0] ?? "";
    const prefix = kind === "heading" ? "## " : kind === "bullet" ? "- " : kind === "numbered" ? `${index}. ` : "> ";
    const removing = existing === prefix;
    changes.push({ from: line.from, to: line.from + existing.length, insert: removing ? "" : prefix });
  }

  view.dispatch({ changes });
}

function insertLink(view: EditorView): void {
  const { state } = view;
  const { from, to } = state.selection.main;
  const text = state.doc.sliceString(from, to) || "متن لینک";
  const placeholder = "https://";
  const urlStart = from + 1 + text.length + 2;
  view.dispatch({
    changes: { from, to, insert: `[${text}](${placeholder})` },
    selection: EditorSelection.range(urlStart, urlStart + placeholder.length),
  });
}

// Inserts a block on its own lines. `select` highlights a placeholder inside the block so the user can type over it.
function insertBlock(view: EditorView, block: string, select?: { offset: number; length: number }): void {
  const { state } = view;
  const { from, to } = state.selection.main;
  const before = from > 0 && state.doc.sliceString(from - 1, from) !== "\n" ? "\n" : "";
  const text = `${before}\n${block}\n`;
  const blockStart = from + before.length + 1;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: select
      ? EditorSelection.range(blockStart + select.offset, blockStart + select.offset + select.length)
      : EditorSelection.cursor(blockStart + block.length),
  });
}

const tableTemplate = [
  "| ستون ۱ | ستون ۲ | ستون ۳ |",
  "| :--- | :---: | ---: |",
  "| مقدار | مقدار | مقدار |",
].join("\n");

export function applyFormat(view: EditorView, action: FormatAction): void {
  const marker = wrapMarkers[action];
  if (marker) return toggleWrap(view, marker);

  switch (action) {
    case "link":
      return insertLink(view);
    case "heading":
    case "bullet":
    case "numbered":
    case "quote":
      return setLinePrefix(view, action);
    case "codeBlock": {
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to) || "کد";
      return insertBlock(view, `\`\`\`\n${selected}\n\`\`\``, { offset: 4, length: selected.length });
    }
    case "table":
      return insertBlock(view, tableTemplate);
    case "rule":
      return insertBlock(view, "---");
  }
}

// Ctrl/⌘ shortcuts. The highlight shortcut is Ctrl+Shift+H, since Ctrl+H is taken by the browser.
export const formatKeymap = keymap.of([
  { key: "Mod-b", run: (view) => { applyFormat(view, "bold"); return true; } },
  { key: "Mod-i", run: (view) => { applyFormat(view, "italic"); return true; } },
  { key: "Mod-e", run: (view) => { applyFormat(view, "code"); return true; } },
  { key: "Mod-k", run: (view) => { applyFormat(view, "link"); return true; } },
  { key: "Mod-Shift-h", run: (view) => { applyFormat(view, "highlight"); return true; } },
]);
