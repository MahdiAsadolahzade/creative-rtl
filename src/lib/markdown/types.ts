import type { DirectionMeta, DirectionMode, BidiDirection } from "@/lib/bidi/types";

export type RenderOptions = {
  source: string;
  mode: "markdown" | "html";
  dir: DirectionMode;
  softBreaks?: "markdown" | "preserve";
  nestedMarkdown?: "preview" | "source";
  nestedDepth?: number;
};

export type RenderBlock = {
  id: string;
  kind: "html" | "mermaid";
  dir: BidiDirection;
  html: string;
  line: number;
  mermaid?: { source: string };
};

export type RenderResponse = {
  v: 1;
  blocks: RenderBlock[];
  meta: {
    direction: DirectionMeta;
    stats: { chars: number; words: number; blocks: number };
    headings: { id: string; text: string; depth: number }[];
    features: { mermaid: boolean; math: boolean; code: boolean; nestedMarkdown: boolean };
    warnings: string[];
  };
};
