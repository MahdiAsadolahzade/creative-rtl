export const siteConfig = {
  name: "creative-rtl",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  repoUrl: "https://github.com/MahdiAsadolahzade/creative-rtl",
  contributeUrl: "https://github.com/MahdiAsadolahzade/creative-rtl/issues",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL ?? "https://coffeebede.com/creative-rtl",
  license: "MIT",
  description:
    "پیش‌نمایش Markdown فارسی برای متن‌های ترکیبی؛ رندر دقیق RTL و LTR، Mermaid و فرمول‌های ریاضی.",
  keywords: [
    "پیش‌نمایش Markdown فارسی",
    "ادیتور Markdown راست‌چین",
    "رندر Markdown RTL",
    "Mermaid فارسی",
  ],
} as const;
