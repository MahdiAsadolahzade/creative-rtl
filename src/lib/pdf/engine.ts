export type PdfFormat = "pdf" | "png";

export type PdfRenderOptions = {
  format: PdfFormat;
  pageSize?: "A4" | "Letter";
  javaScriptEnabled?: boolean;
  timeoutMs?: number;
};

export interface PdfEngine {
  render(html: string, options: PdfRenderOptions): Promise<Buffer>;
}
