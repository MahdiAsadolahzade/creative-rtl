import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildMermaidRunner } from "./mermaid-runner";

type ExportAssets = {
  css: string;
  fontCss: string;
  mermaidScript: string;
};

let cached: Promise<ExportAssets> | undefined;

async function dataUrl(filePath: string, mime: string): Promise<string> {
  const buffer = await readFile(filePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function fontFace(name: string, fileName: string, weight: number): Promise<string> {
  const filePath = path.join(process.cwd(), "src", "fonts", fileName);
  const src = await dataUrl(filePath, "font/ttf");
  return `@font-face{font-family:"${name}";src:url("${src}") format("truetype");font-weight:${weight};font-style:normal;font-display:block;}`;
}

async function inlineKatexFonts(css: string, root: string): Promise<string> {
  const matches = [...css.matchAll(/url\((["']?)(fonts\/[^)"']+)\1\)/gu)];
  let result = css;
  for (const match of matches) {
    const relative = match[2];
    if (!relative) continue;
    const filePath = path.join(root, "node_modules", "katex", "dist", relative);
    const mime = relative.endsWith(".woff2") ? "font/woff2" : "font/woff";
    const replacement = `url("${await dataUrl(filePath, mime)}")`;
    result = result.replaceAll(match[0], replacement);
  }
  return result;
}

async function loadAssets(): Promise<ExportAssets> {
  const root = process.cwd();
  const [tokens, paper, print, katex] = await Promise.all([
    readFile(path.join(root, "src", "styles", "tokens.css"), "utf8"),
    readFile(path.join(root, "src", "styles", "paper.css"), "utf8"),
    readFile(path.join(root, "src", "styles", "print.css"), "utf8"),
    readFile(path.join(root, "node_modules", "katex", "dist", "katex.min.css"), "utf8"),
  ]);
  const mermaidBundle = await readFile(path.join(root, "node_modules", "mermaid", "dist", "mermaid.min.js"), "utf8");
  const fontCss = [
    await fontFace("Peyda Export", "PeydaNoEn-Regular.ttf", 400),
    await fontFace("Peyda Export", "PeydaNoEn-Bold.ttf", 700),
    await fontFace("Peyda Export", "PeydaNoEn-ExtraBold.ttf", 800),
  ].join("");
  const katexCss = await inlineKatexFonts(katex, root);
  const css = `
    ${tokens}
    ${paper}
    ${print}
    ${katexCss}
    html,body{font-family:"Peyda Export",Tahoma,Arial,sans-serif}
    .paper :where(code,pre){font-family:"JetBrains Mono","Courier New",monospace}
    .export-image-placeholder{display:block;padding:1rem;border:1px solid var(--paper-rule);color:var(--paper-dim);text-align:center}
  `;
  const runner = buildMermaidRunner();
  return { css, fontCss, mermaidScript: `${mermaidBundle}\n${runner}` };
}

export function getExportAssets(): Promise<ExportAssets> {
  cached ??= loadAssets();
  return cached;
}
