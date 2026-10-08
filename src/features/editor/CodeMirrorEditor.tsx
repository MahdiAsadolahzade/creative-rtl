"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, highlightSpecialChars, keymap, lineNumbers, placeholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { classHighlighter } from "@lezer/highlight";

type CodeMirrorEditorProps = {
  value: string;
  onChange: (value: string) => void;
  theme: "dark" | "light";
  ariaLabel?: string;
};

export function CodeMirrorEditor({ value, onChange, theme, ariaLabel = "متن Markdown" }: CodeMirrorEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        highlightSpecialChars(),
        syntaxHighlighting(classHighlighter),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        markdown(),
        EditorView.lineWrapping,
        EditorView.perLineTextDirection.of(true),
        placeholder("متن Markdown را این‌جا وارد کنید…"),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px", backgroundColor: "transparent" },
          ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono), monospace", lineHeight: "1.9" },
          ".cm-gutters": { backgroundColor: "transparent", color: "var(--text-faint)", border: "none", minWidth: "2.6rem" },
          ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--primary) 7%, transparent)" },
          ".cm-content": { paddingBlock: "1rem", paddingInlineEnd: "1rem", caretColor: "var(--accent)" },
          ".cm-line": { paddingInline: "0.4rem" },
          ".cm-placeholder": { color: "var(--text-faint)", fontFamily: "var(--font-fa), sans-serif" },
        }),
      ],
    });
    const view = new EditorView({ state: startState, parent: hostRef.current });
    view.dom.setAttribute("aria-label", ariaLabel);
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === view.state.doc.toString()) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    hostRef.current?.setAttribute("data-editor-theme", theme);
  }, [theme]);

  return <div ref={hostRef} className="code-mirror-host" dir="ltr" data-editor-theme={theme} />;
}
