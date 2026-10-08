export type MermaidPaperTokens = {
  background?: string;
  foreground?: string;
  primary?: string;
  border?: string;
};

export function mermaidConfig(fontFamily: string, tokens: MermaidPaperTokens = {}) {
  const background = tokens.background || "#ffffff";
  const foreground = tokens.foreground || "#0b1220";
  const primary = tokens.primary || "#4f46e5";
  const border = tokens.border || "#cbd5e1";
  return {
    startOnLoad: false,
    securityLevel: "strict" as const,
    theme: "base" as const,
    fontFamily,
    themeVariables: {
      background,
      primaryColor: background,
      primaryTextColor: foreground,
      primaryBorderColor: border,
      lineColor: primary,
      textColor: foreground,
    },
  };
}
