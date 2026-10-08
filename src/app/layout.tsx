import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "creative-rtl — پیش‌نمایش Markdown راست‌چین و چپ‌چین",
    template: "%s | creative-rtl",
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    title: "creative-rtl — همان متن. جهت درست.",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "creative-rtl" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  colorScheme: "light dark" as const,
};

const themeScript = `
(function () {
  try {
    var p = localStorage.getItem("creative-rtl:v1:prefs");
    var t = p ? JSON.parse(p).theme : null;
    if (t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (_) {}
}());
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
