import type { Element, Root } from "hast";

type Parent = Root | Element;

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "element";
}

// Wide tables scroll inside their own box instead of squeezing every column.
function walk(parent: Parent): void {
  parent.children = parent.children.map((child) => {
    if (!isElement(child)) return child;
    if (child.tagName !== "table") {
      walk(child);
      return child;
    }
    return {
      type: "element",
      tagName: "div",
      properties: { className: ["table-wrap"] },
      children: [child],
      position: child.position,
    } satisfies Element;
  }) as Parent["children"];
}

export function rehypeTableWrap() {
  return (tree: Root) => walk(tree);
}
