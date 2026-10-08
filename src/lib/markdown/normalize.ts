const fencePattern = /^(\s*)(`{3,}|~{3,})(.*)$/;

export function normalizeSource(source: string): string {
  return source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/u, ""))
    .join("\n");
}

export function repairNestedFences(source: string): string {
  const lines = source.split("\n");
  let inFence = false;
  let outerChar = "";
  let outerLength = 0;
  return lines.map((line) => {
    const match = line.match(fencePattern);
    if (!match) return line;
    const fence = match[2] ?? "";
    const char = fence[0] ?? "";
    if (!inFence) {
      inFence = true;
      outerChar = char;
      outerLength = fence.length;
      return line;
    }
    if (char === outerChar && fence.length === outerLength && (match[3] ?? "").trim()) {
      return `${match[1] ?? ""}${char.repeat(outerLength + 1)}${match[3] ?? ""}`;
    }
    if (char === outerChar && fence.length >= outerLength) {
      inFence = false;
      outerChar = "";
      outerLength = 0;
      return line;
    }
    if (char === outerChar && fence.length === 3) {
      return `${match[1] ?? ""}${char.repeat(Math.max(outerLength + 1, 4))}${match[3] ?? ""}`;
    }
    return line;
  }).join("\n");
}

export function normalizeLatexDelimiters(source: string): string {
  return source
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, content: string) => `$$${content}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, content: string) => `$${content}$`);
}

export function normalizePersianOrderedLists(source: string): string {
  return source.replace(/^(\s*)([۰-۹٠-٩]+)[.)]\s+/gmu, "$11. ");
}

export function normalizeMarkdown(source: string): string {
  return normalizeLatexDelimiters(
    normalizePersianOrderedLists(repairNestedFences(normalizeSource(source))),
  );
}
