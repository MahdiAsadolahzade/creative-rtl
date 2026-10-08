import { classifyChar } from "./classify";
import type { BidiDirection } from "./types";

const connectors = new Set(["-", ".", "_", "/", "+", "#", "'", "&", "%", ":", "@"]);
const numeric = /\p{N}/u;
const opening = new Map([["(", ")"], ["[", "]"], ["{", "}"], ["«", "»"], ["“", "”"], ['"', '"']]);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function isRunChar(char: string): boolean {
  return numeric.test(char) || connectors.has(char);
}

export function isolateRuns(text: string, direction: BidiDirection): string {
  const opposite: BidiDirection = direction === "rtl" ? "ltr" : "rtl";
  let output = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? "";
    const kind = classifyChar(char);
    const close = opening.get(char);
    if (close) {
      const closeIndex = text.indexOf(close, index + char.length);
      if (closeIndex > index && classifyChar(text[index + char.length] ?? "") === opposite) {
        const inner = text.slice(index + char.length, closeIndex);
        if (inner && [...inner].every((part) => classifyChar(part) === opposite || isRunChar(part) || /\s/u.test(part))) {
          output += `<bdi dir="${opposite}">${escapeHtml(char + inner + close)}</bdi>`;
          index = closeIndex + close.length;
          continue;
        }
      }
    }
    if (kind !== opposite) {
      output += escapeHtml(char);
      index += char.length;
      continue;
    }
    let end = index + char.length;
    while (end < text.length && (classifyChar(text[end] ?? "") === opposite || isRunChar(text[end] ?? ""))) end += (text[end] ?? "").length;
    while (end < text.length) {
      const spaceStart = end;
      while (end < text.length && /[ \t\u00a0]/u.test(text[end] ?? "")) end += (text[end] ?? "").length;
      const next = text[end] ?? "";
      const nextKind = classifyChar(next);
      if (nextKind === opposite || numeric.test(next)) {
        while (end < text.length && (classifyChar(text[end] ?? "") === opposite || isRunChar(text[end] ?? ""))) end += (text[end] ?? "").length;
        continue;
      }
      if (connectors.has(next)) {
        let connectorEnd = end + next.length;
        while (connectorEnd < text.length && /[ \t\u00a0]/u.test(text[connectorEnd] ?? "")) connectorEnd += (text[connectorEnd] ?? "").length;
        if (classifyChar(text[connectorEnd] ?? "") === opposite) {
          end = connectorEnd;
          while (end < text.length && (classifyChar(text[end] ?? "") === opposite || isRunChar(text[end] ?? ""))) end += (text[end] ?? "").length;
          continue;
        }
      }
      end = spaceStart;
      break;
    }
    let runEnd = end;
    while (runEnd > index && [".", ",", ":", "%", "&"].includes(text[runEnd - 1] ?? "")) runEnd -= 1;
    const run = text.slice(index, runEnd);
    output += `<bdi dir="${opposite}">${escapeHtml(run)}</bdi>`;
    index = runEnd;
  }
  return output;
}

export function stripForDirection(text: string): string {
  return text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/\$[^$]*\$/g, " ").replace(/https?:\/\/\S+/g, " ");
}
