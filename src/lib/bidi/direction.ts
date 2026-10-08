import { firstStrong, getDirectionStats } from "./classify";
import type { BidiDirection, DirectionMeta, DirectionMode } from "./types";

const MIN_STRONG = 4;

export function resolveBlockDir(text: string, context: BidiDirection = "rtl", forced?: BidiDirection): BidiDirection {
  if (forced) return forced;
  const stats = getDirectionStats(text);
  if (stats.total < MIN_STRONG) return context;
  const ratio = stats.rtl / stats.total;
  if (ratio > 0.65) return "rtl";
  if (ratio < 0.35) return "ltr";
  return context ?? firstStrong(text) ?? "rtl";
}

export function documentDirection(text: string, forced: DirectionMode = "auto"): DirectionMeta {
  const forcedDir = forced === "auto" ? null : forced;
  if (forcedDir) return { dominant: forcedDir, mixed: false, rtlShare: forcedDir === "rtl" ? 1 : 0, forced: forcedDir };
  const stats = getDirectionStats(text);
  if (!stats.total) return { dominant: "none", mixed: false, rtlShare: 0, forced: null };
  const rtlShare = stats.rtl / stats.total;
  const dominant: BidiDirection = rtlShare >= 0.5 ? "rtl" : "ltr";
  const minorityShare = Math.min(rtlShare, 1 - rtlShare);
  return { dominant, mixed: minorityShare >= 0.1, rtlShare, forced: null };
}

export function directionLabel(meta: DirectionMeta, mode: DirectionMode): string {
  if (mode !== "auto") return `${mode.toUpperCase()} (دستی)`;
  if (meta.dominant === "none") return "جهت: خودکار";
  if (meta.mixed) return `ترکیبی · غالب ${meta.dominant.toUpperCase()}`;
  return meta.dominant === "rtl" ? "راست‌چین" : "چپ‌چین";
}
