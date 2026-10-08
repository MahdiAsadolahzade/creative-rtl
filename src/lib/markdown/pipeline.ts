import "server-only";

import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeParse from "rehype-parse";
import rehypeShiki from "@shikijs/rehype";
import type { Element, Root, Text } from "hast";
import { getDirectionStats } from "@/lib/bidi/classify";
import { documentDirection, resolveBlockDir } from "@/lib/bidi/direction";
import { isolateRuns, stripForDirection } from "@/lib/bidi/isolate";
import type { BidiDirection } from "@/lib/bidi/types";
import { normalizeMarkdown } from "./normalize";
import { sanitizeSchema } from "./sanitize-schema";
import { rehypeBidi } from "./plugins/rehypeBidi";
import { rehypeMathIsolate } from "./plugins/rehypeMathIsolate";
import { rehypeRestrictUrls } from "./plugins/rehypeRestrictUrls";
import { rehypeRestrictStyles } from "./plugins/rehypeRestrictStyles";
import { rehypeBlockChrome } from "./plugins/rehypeBlockChrome";
import type { RenderBlock, RenderOptions, RenderResponse } from "./types";

type CacheEntry = { key: string; value: RenderResponse };
const cache: CacheEntry[] = [];
const MAX_CACHE = 100;

function isElement(node: unknown): node is Element {
  return typeof node === "object" && node !== null && "type" in node && (node as { type?: string }).type === "element";
}

function textContent(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  if ("type" in node && (node as { type?: string }).type === "text") return (node as Text).value;
  if ("children" in node) return ((node as { children?: unknown[] }).children ?? []).map(textContent).join("");
  return "";
}

function addClass(element: Element, name: string): void {
  const current = Array.isArray(element.properties.className)
    ? element.properties.className.join(" ")
    : typeof element.properties.className === "string" ? element.properties.className : "";
  element.properties.className = `${current} ${name}`.trim().split(/\s+/u).filter(Boolean);
}

function classNames(element: Element): string[] {
  const value = element.properties.className ?? element.properties.class;
  if (Array.isArray(value)) return value.filter((name): name is string => typeof name === "string");
  return typeof value === "string" ? value.split(/\s+/u).filter(Boolean) : [];
}

function findDescendant(node: unknown, predicate: (element: Element) => boolean): Element | undefined {
  if (!isElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of node.children) {
    const match = findDescendant(child, predicate);
    if (match) return match;
  }
  return undefined;
}

function hasClassOrTag(node: unknown, names: Set<string>): boolean {
  if (!isElement(node)) return false;
  if (names.has(node.tagName) || classNames(node).some((name) => names.has(name))) return true;
  return node.children.some((child) => hasClassOrTag(child, names));
}

function isProtected(element: Element): boolean {
  const name = element.tagName.toLowerCase();
  const classes = classNames(element);
  return name === "code" || name === "pre" || name === "kbd" || name === "samp" || name === "svg" || name === "style" || name === "bdi" ||
    classes.includes("katex");
}

function isolateChildren(element: Element, direction: BidiDirection): void {
  if (isProtected(element)) return;
  element.children = element.children.flatMap((child) => {
    if (child.type === "text") {
      const value = isolateRuns(child.value, direction);
      return [{ type: "raw", value }];
    }
    if (isElement(child)) {
      isolateChildren(child, direction);
    }
    return [child];
  });
}

function blockLine(element: Element): number {
  const start = element.position?.start?.line;
  return typeof start === "number" ? start : 1;
}

function processTree(tree: Root, options: RenderOptions, source: string): { blocks: RenderBlock[]; headings: RenderResponse["meta"]["headings"] } {
  const docMeta = documentDirection(stripForDirection(source), options.dir);
  const fallback = docMeta.dominant === "ltr" ? "ltr" : "rtl";
  const headings: RenderResponse["meta"]["headings"] = [];
  const blocks: RenderBlock[] = [];

  for (const node of tree.children) {
    if (!isElement(node)) continue;
    const plain = textContent(node);
    const tag = node.tagName.toLowerCase();
    const dataKind = typeof node.properties.dataKind === "string" ? node.properties.dataKind : "";
    const isCode = tag === "pre" || tag === "code" || dataKind === "code" || dataKind === "mermaid" || tag === "math";
    const isMermaid = dataKind === "mermaid" || (tag === "pre" && textContent(node).trim().length > 0 &&
      node.children.some((child) => isElement(child) && classNames(child).includes("language-mermaid")));
    const direction = isCode || isMermaid ? "ltr" : resolveBlockDir(stripForDirection(plain), fallback, options.dir === "auto" ? undefined : options.dir);
    node.properties.dir = direction;
    if (!isCode) isolateChildren(node, direction);
    if (tag === "pre") addClass(node, "code-block");
    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const id = typeof node.properties.id === "string" ? node.properties.id : "";
      headings.push({ id, text: plain, depth: Number(tag.slice(1)) });
    }
    const html = String(unified().use(rehypeStringify, { allowDangerousHtml: true }).stringify({ type: "root", children: [node] }));
    const id = createHash("sha1").update(`${html}|${direction}|${tag}`).digest("hex").slice(0, 12);
    const mermaidCode = isMermaid
      ? findDescendant(node, (element) => element.tagName === "code" && classNames(element).includes("language-mermaid"))
      : undefined;
    const mermaidSource = mermaidCode ? textContent(mermaidCode).trim() : undefined;
    blocks.push({ id, kind: isMermaid ? "mermaid" : "html", dir: direction, html, line: blockLine(node), ...(mermaidSource ? { mermaid: { source: mermaidSource } } : {}) });
  }
  return { blocks, headings };
}

function decodeCode(value: string): string {
  return value.replace(/&#x3C;/g, "<").replace(/&#x3E;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

async function decorateNestedMarkdown(html: string, options: RenderOptions): Promise<string> {
  if (options.nestedMarkdown === "source" || (options.nestedDepth ?? 0) >= 2) return html;
  const match = html.match(/<pre([^>]*)><code[^>]*class="language-(?:markdown|md|mdx)"[^>]*>([\s\S]*?)<\/code><\/pre>/);
  if (!match) return html;
  const raw = decodeCode(match[2] ?? "");
  const nested = await renderDocument({ ...options, source: raw, nestedDepth: (options.nestedDepth ?? 0) + 1 });
  const preview = nested.blocks.map((block) => block.html).join("");
  const source = `<pre class="nested-md__source" dir="ltr"><code>${match[2] ?? ""}</code></pre>`;
  return `<figure class="nested-md" data-view="preview"><figcaption><span>Markdown</span><span><button type="button" data-action="nested-toggle">کد / پیش‌نمایش</button><button type="button" data-action="copy-code">کپی</button></span></figcaption><div class="nested-md__preview">${preview}</div>${source}</figure>`;
}

function renderAlertHtml(html: string): string {
  const labels: Record<string, string> = { NOTE: "نکته", TIP: "توصیه", IMPORTANT: "مهم", WARNING: "هشدار", CAUTION: "احتیاط" };
  return html.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/g, (_m, key: string, body: string) =>
    `<aside class="alert" data-alert="${key}"><div class="alert__title">${labels[key] ?? key}</div><div>${body}</div></aside>`,
  );
}

async function renderUncached(options: RenderOptions): Promise<RenderResponse> {
  const source = options.mode === "markdown" ? normalizeMarkdown(options.source) : options.source;
  const processor = unified();
  if (options.mode === "markdown") {
    processor.use(remarkParse).use(remarkGfm).use(remarkMath);
    if (options.softBreaks === "preserve") processor.use(remarkBreaks);
    processor.use(remarkRehype, { allowDangerousHtml: true });
  } else {
    processor.use(rehypeParse, { fragment: true });
  }
  const configured = processor
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeRestrictUrls)
    .use(rehypeRestrictStyles)
    .use(rehypeSlug)
    .use(rehypeBidi, { dir: options.dir })
    .use(rehypeKatex)
    .use(rehypeMathIsolate)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      langs: ["javascript", "typescript", "python", "json", "bash", "html", "css", "markdown"],
      fallbackLanguage: "text",
      addLanguageClass: true,
      lazy: true,
      onError: () => undefined,
    })
    .use(rehypeBlockChrome);
  const parsed = configured.parse(source);
  const tree = await configured.run(parsed as unknown as Root) as Root;
  const processed = processTree(tree, options, source);
  const blocks = await Promise.all(processed.blocks.map(async (block) => ({
    ...block,
    html: renderAlertHtml(await decorateNestedMarkdown(block.html, options)),
  })));
  const stats = getDirectionStats(stripForDirection(source));
  const direction = documentDirection(stripForDirection(source), options.dir);
  return {
    v: 1,
    blocks,
    meta: {
      direction,
      stats: { chars: source.length, words: source.trim() ? source.trim().split(/\s+/u).length : 0, blocks: blocks.length },
      headings: processed.headings,
      features: {
        mermaid: blocks.some((block) => block.kind === "mermaid"),
        math: hasClassOrTag(tree, new Set(["math", "katex", "math-inline", "math-display"])),
        code: blocks.some((block) => block.html.includes("block--code") || block.html.includes("code-block")),
        nestedMarkdown: hasClassOrTag(tree, new Set(["language-markdown", "language-md", "language-mdx"])),
      },
      warnings: [],
    },
  };
}

export async function renderDocument(options: RenderOptions): Promise<RenderResponse> {
  const key = createHash("sha1").update(JSON.stringify(options)).digest("hex");
  const found = cache.find((entry) => entry.key === key);
  if (found) return found.value;
  const value = await renderUncached(options);
  cache.unshift({ key, value });
  if (cache.length > MAX_CACHE) cache.pop();
  return value;
}
