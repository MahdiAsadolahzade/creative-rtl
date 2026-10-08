"use client";

const inlineProperties = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "color",
  "background-color",
  "direction",
  "text-align",
  "margin-block-start",
  "margin-block-end",
  "padding-block-start",
  "padding-block-end",
  "padding-inline-start",
  "padding-inline-end",
  "border-block-start",
  "border-block-end",
  "border-inline-start",
  "border-inline-end",
  "list-style",
];

function inlineComputedStyles(source: HTMLElement, clone: HTMLElement): void {
  const sourceElements = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const cloneElements = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  sourceElements.forEach((element, index) => {
    const target = cloneElements[index];
    if (!target) return;
    const styles = getComputedStyle(element);
    inlineProperties.forEach((property) => target.style.setProperty(property, styles.getPropertyValue(property)));
  });
}

export async function copyPreview(preview: HTMLElement, plainText: string): Promise<void> {
  const clone = preview.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".block-menu, .block-menu-popover, button, .sr-only").forEach((element) => element.remove());
  clone.classList.add("export-copy-preview");
  inlineComputedStyles(preview, clone);
  const html = clone.innerHTML;
  if ("ClipboardItem" in window && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      }),
    ]);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = plainText;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
