import type { Element, Root } from "hast";

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "element";
}

function walk(node: Root | Element): void {
  for (const child of node.children) {
    if (!isElement(child)) continue;
    const href = typeof child.properties.href === "string" ? child.properties.href : "";
    const src = typeof child.properties.src === "string" ? child.properties.src : "";
    if (child.tagName === "a" && href && !/^(https?:|mailto:|tel:|#)/iu.test(href)) delete child.properties.href;
    if (child.tagName === "img" && src && !/^https:\/\//iu.test(src) && !/^data:image\/(?:png|jpeg|gif|webp);base64,/iu.test(src)) delete child.properties.src;
    if (child.tagName === "a" && /^https?:\/\//iu.test(href)) {
      child.properties.target = "_blank";
      child.properties.rel = ["noopener", "noreferrer", "nofollow", "ugc"];
    }
    if (child.tagName === "img") {
      child.properties.loading = "lazy";
      child.properties.decoding = "async";
      child.properties.referrerPolicy = "no-referrer";
    }
    walk(child);
  }
}

export function rehypeRestrictUrls() {
  return (tree: Root) => walk(tree);
}
