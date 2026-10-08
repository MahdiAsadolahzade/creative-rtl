import type { Element, Root } from "hast";

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && "type" in node && (node as { type?: string }).type === "element";
}

function safeCss(value: string): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/@import[^;{}]+;?/giu, "")
    .replace(/url\([^)]*\)/giu, "none")
    .replace(/expression\([^)]*\)/giu, "none")
    .replace(/(?:behavior|-moz-binding)\s*:[^;{}]*;?/giu, "")
    .replace(/\b(?:javascript|vbscript)\s*:/giu, "")
    .trim();
}

function visit(node: { children?: unknown[] }, inStyle = false): void {
  for (const child of node.children ?? []) {
    if (!isElement(child)) {
      if (inStyle && typeof child === "object" && child !== null && "value" in child && typeof child.value === "string") {
        child.value = safeCss(child.value);
      }
      continue;
    }
    if (typeof child.properties.style === "string") {
      child.properties.style = safeCss(child.properties.style);
    }
    visit(child, child.tagName === "style");
  }
}

export function rehypeRestrictStyles() {
  return (tree: Root): void => {
    visit(tree);
  };
}
