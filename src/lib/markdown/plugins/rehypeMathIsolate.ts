import type { Element, Root } from "hast";

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "element";
}

function walk(node: Root | Element): void {
  for (const child of node.children) {
    if (!isElement(child)) continue;
    const classes = Array.isArray(child.properties.className) ? child.properties.className : [];
    if (child.tagName === "span" && (classes.includes("katex") || classes.includes("katex-display"))) {
      child.properties.dir = "ltr";
    }
    walk(child);
  }
}

export function rehypeMathIsolate() {
  return (tree: Root) => walk(tree);
}
