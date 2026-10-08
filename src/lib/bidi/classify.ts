import type { DirectionStats } from "./types";

const rtlScript = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
const letter = /\p{L}/u;

export function classifyChar(char: string): "rtl" | "ltr" | "neutral" {
  if (!letter.test(char)) return "neutral";
  return rtlScript.test(char) ? "rtl" : "ltr";
}

export function getDirectionStats(text: string): DirectionStats {
  let rtl = 0;
  let ltr = 0;
  for (const char of text) {
    const kind = classifyChar(char);
    if (kind === "rtl") rtl += 1;
    if (kind === "ltr") ltr += 1;
  }
  return { rtl, ltr, total: rtl + ltr };
}

export function firstStrong(text: string): "rtl" | "ltr" | null {
  for (const char of text) {
    const kind = classifyChar(char);
    if (kind !== "neutral") return kind;
  }
  return null;
}
