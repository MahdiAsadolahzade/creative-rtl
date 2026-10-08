import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

export const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details", "summary", "kbd", "sub", "sup", "mark", "bdi", "figure", "figcaption",
    "audio", "video", "source", "track", "style",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      ["dir", "ltr", "rtl", "auto"],
      ["lang", /^[a-zA-Z-]{2,10}$/],
      ["className", /^[a-zA-Z0-9_:\-. ]+$/u],
      ["id", /^[a-zA-Z][a-zA-Z0-9_:\-.]*$/u],
      ["style", /^[^<>]*$/u],
    ],
    audio: [
      ...(defaultSchema.attributes?.audio ?? []),
      "controls", "loop", "muted", "preload",
      ["src", /^(?:https:\/\/|data:audio\/)/iu],
    ],
    source: [
      ...(defaultSchema.attributes?.source ?? []),
      ["src", /^(?:https:\/\/|data:audio\/)/iu],
      ["type", /^[a-zA-Z0-9.+/-]+$/u],
    ],
    video: [
      ...(defaultSchema.attributes?.video ?? []),
      "controls", "loop", "muted", "playsInline", "poster",
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^(language-[\w-]+|math-(inline|display))$/],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto", "tel"],
    src: ["https", "data"],
  },
};
