import type { Element, ElementContent, Root, Text } from "hast";
import type { BidiDirection, DirectionMode } from "@/lib/bidi/types";
import { getDirectionStats } from "@/lib/bidi/classify";
import { resolveBlockDir } from "@/lib/bidi/direction";
import { isolateRuns } from "@/lib/bidi/isolate";

type Options = { dir?: DirectionMode };

const blockTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td", "th", "caption", "figcaption", "aside", "dt", "dd"]);
const protectedTags = new Set(["code", "pre", "kbd", "samp", "svg", "bdi"]);

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "element";
}

function textContent(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  if ((node as { type?: string }).type === "text") return (node as Text).value;
  const children = (node as { children?: unknown[] }).children;
  return children ? children.map(textContent).join("") : "";
}

function classes(element: Element): string[] {
  return Array.isArray(element.properties.className) ? element.properties.className : [];
}

function isProtected(element: Element): boolean {
  return protectedTags.has(element.tagName.toLowerCase()) || classes(element).some((name) => name === "katex" || name === "math-inline" || name === "math-display");
}

function setDir(element: Element, context: BidiDirection, forced?: BidiDirection): BidiDirection {
  const tag = element.tagName.toLowerCase();
  const direction = tag === "pre" || tag === "code" || tag === "math"
    ? "ltr"
    : resolveBlockDir(textContent(element), context, forced);
  element.properties.dir = direction;
  return direction;
}

function visitChildren(element: Element, context: BidiDirection, forced?: BidiDirection): void {
  if (isProtected(element)) return;
  const children: ElementContent[] = [];
  for (const child of element.children) {
    if (child.type === "text") {
      children.push({ type: "raw", value: isolateRuns(child.value, context) });
      continue;
    }
    if (!isElement(child)) {
      children.push(child);
      continue;
    }
    const tag = child.tagName.toLowerCase();
    let childContext = context;
    if (tag === "ul" || tag === "ol") {
      const listText = child.children.filter((item) => isElement(item) && item.tagName === "li").map(textContent).join(" ");
      childContext = setDir(child, resolveBlockDir(listText, context, forced), forced);
    } else if (tag === "table") {
      const tableText = textContent(child);
      childContext = setDir(child, resolveBlockDir(tableText, context, forced), forced);
    } else if (blockTags.has(tag) || tag === "pre" || tag === "code" || tag === "math") {
      childContext = setDir(child, context, forced);
    }
    visitChildren(child, childContext, forced);
    children.push(child);
  }
  element.children = children;
}

export function rehypeBidi(options: Options = {}) {
  return (tree: Root) => {
    const stats = getDirectionStats(textContent(tree));
    const fallback: BidiDirection = stats.total === 0 || stats.rtl / stats.total >= 0.5 ? "rtl" : "ltr";
    const forced = options.dir && options.dir !== "auto" ? options.dir : undefined;
    const root: Element = {
      type: "element",
      tagName: "div",
      properties: {},
      children: tree.children.filter((child): child is ElementContent => child.type !== "doctype"),
    };
    visitChildren(root, fallback, forced);
    tree.children = root.children;
  };
}
