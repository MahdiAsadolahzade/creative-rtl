import { CircleDot } from "lucide-react";
import type { DirectionMeta, DirectionMode } from "@/lib/bidi/types";

type DirectionChipProps = {
  meta?: DirectionMeta;
  mode?: DirectionMode;
  compact?: boolean;
};

export function DirectionChip({ meta, mode = "auto", compact = false }: DirectionChipProps) {
  const forced = mode !== "auto";
  const dominant = meta?.dominant ?? "none";
  let label = "جهت: خودکار";
  if (forced) label = `${mode.toUpperCase()} (دستی)`;
  else if (dominant === "rtl" && meta?.mixed) label = "ترکیبی · غالب RTL";
  else if (dominant === "ltr" && meta?.mixed) label = "ترکیبی · غالب LTR";
  else if (dominant === "rtl") label = "راست‌چین";
  else if (dominant === "ltr") label = "چپ‌چین";
  return (
    <span className={`direction-chip ${forced ? "is-forced" : ""}`} aria-live="polite">
      <CircleDot size={compact ? 12 : 14} aria-hidden="true" />
      <span>{compact ? (forced ? mode.toUpperCase() : "RTL Auto") : label}</span>
    </span>
  );
}
