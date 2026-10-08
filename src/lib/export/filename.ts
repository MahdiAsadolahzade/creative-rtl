function transliterate(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s_-]+/gu, "-")
    .slice(0, 80);
}

export function exportFilename(title: string, extension: "pdf" | "png"): string {
  const slug = transliterate(title) || "creative-rtl";
  return `${slug}.${extension}`;
}

export function contentTitle(title: string | undefined, fallback = "creative-rtl"): string {
  return title?.trim().slice(0, 120) || fallback;
}
