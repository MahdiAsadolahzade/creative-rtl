import type { Element, Root, RootContent } from "hast";

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "element";
}

function classNames(element: Element): string[] {
  const value = element.properties.className ?? element.properties.class;
  if (Array.isArray(value)) return value.filter((name): name is string => typeof name === "string");
  return typeof value === "string" ? value.split(/\s+/u).filter(Boolean) : [];
}

function menu(kind: string): Element {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["block-menu"],
      dataAction: "menu",
      dataKind: kind,
      ariaHaspopup: "menu",
      ariaExpanded: "false",
      ariaLabel: "گزینه‌ها",
    },
    children: [{ type: "text", value: "⋯" }],
  };
}

export function rehypeBlockChrome() {
  return (tree: Root) => {
    const visitChildren = (children: RootContent[]): RootContent[] => children.flatMap((node) => {
      // Shiki returns a root fragment when it replaces a fenced block.
      if ((node as { type?: string }).type === "root") return visitChildren((node as unknown as Root).children);
      if (!isElement(node)) return [node];
      if (node.tagName === "pre") {
        const code = node.children.find(isElement);
        const kind = code && classNames(code).some((name) => name === "language-mermaid") ? "mermaid" : "code";
        return [{
          type: "element",
          tagName: "div",
          properties: { className: ["block", `block--${kind}`], dataKind: kind, dir: "ltr" },
          children: [menu(kind), node],
        } satisfies Element];
      }
      node.children = visitChildren(node.children as unknown as RootContent[]) as typeof node.children;
      return [node];
    });
    tree.children = visitChildren(tree.children);
  };
}
