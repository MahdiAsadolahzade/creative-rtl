import { describe, expect, it } from "vitest";
import { EditorState, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { applyFormat, type FormatAction } from "@/features/editor/format";

// Runs the real CodeMirror transactions against a plain state, without a DOM.
function setup(doc: string, anchor: number, head = anchor) {
  let state = EditorState.create({ doc, selection: { anchor, head } });
  const view = {
    get state() {
      return state;
    },
    dispatch(spec: TransactionSpec) {
      state = state.update(spec).state;
    },
    focus() {},
  } as unknown as EditorView;
  const run = (action: FormatAction) => applyFormat(view, action);
  return {
    run,
    text: () => state.doc.toString(),
    selected: () => state.sliceDoc(state.selection.main.from, state.selection.main.to),
    cursor: () => state.selection.main.from,
  };
}

describe("editor formatting commands", () => {
  it("wraps the selection in bold and toggles it back off", () => {
    const editor = setup("سلام دنیا", 0, 4);
    editor.run("bold");
    expect(editor.text()).toBe("**سلام** دنیا");
    expect(editor.selected()).toBe("سلام");
    editor.run("bold");
    expect(editor.text()).toBe("سلام دنیا");
  });

  it("removes markers when the selection already includes them", () => {
    const editor = setup("**x** y", 0, 5);
    editor.run("bold");
    expect(editor.text()).toBe("x y");
  });

  it("inserts a marker pair with the cursor between them when nothing is selected", () => {
    const editor = setup("", 0);
    editor.run("highlight");
    expect(editor.text()).toBe("====");
    expect(editor.cursor()).toBe(2);
  });

  it("adds the highlight marker around the selection", () => {
    const editor = setup("مهم", 0, 3);
    editor.run("highlight");
    expect(editor.text()).toBe("==مهم==");
  });

  it("toggles a heading prefix on the current line", () => {
    const editor = setup("متن", 0);
    editor.run("heading");
    expect(editor.text()).toBe("## متن");
    editor.run("heading");
    expect(editor.text()).toBe("متن");
  });

  it("numbers each selected line in a numbered list", () => {
    const editor = setup("الف\nب", 0, 5);
    editor.run("numbered");
    expect(editor.text()).toBe("1. الف\n2. ب");
  });

  it("builds a link and selects the URL placeholder", () => {
    const editor = setup("سایت", 0, 4);
    editor.run("link");
    expect(editor.text()).toBe("[سایت](https://)");
    expect(editor.selected()).toBe("https://");
  });

  it("wraps the selection in a fenced code block with the placeholder selected", () => {
    const editor = setup("", 0);
    editor.run("codeBlock");
    expect(editor.text()).toContain("```\nکد\n```");
    expect(editor.selected()).toBe("کد");
  });

  it("covers every action without throwing", () => {
    const actions: FormatAction[] = ["bold", "italic", "strike", "highlight", "code", "link", "heading", "bullet", "numbered", "quote", "codeBlock", "table", "rule"];
    for (const action of actions) {
      const editor = setup("متن", 0, 2);
      expect(() => editor.run(action)).not.toThrow();
    }
  });
});
