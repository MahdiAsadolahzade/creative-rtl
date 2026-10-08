import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const peyda = localFont({
  src: [
    { path: "../fonts/PeydaNoEn-Regular.ttf", weight: "400" },
    { path: "../fonts/PeydaNoEn-Light.ttf", weight: "300" },
    { path: "../fonts/PeydaNoEn-Medium.ttf", weight: "500" },
    { path: "../fonts/PeydaNoEn-SemiBold.ttf", weight: "600" },
    { path: "../fonts/PeydaNoEn-Bold.ttf", weight: "700" },
    { path: "../fonts/PeydaNoEn-ExtraBold.ttf", weight: "800" },
    { path: "../fonts/PeydaNoEn-Black.ttf", weight: "900" },
  ],
  variable: "--font-fa",
  display: "swap",
});

const peydaFaNum = localFont({
  src: [
    { path: "../fonts/PeydaFaNum-Regular.ttf", weight: "400" },
    { path: "../fonts/PeydaFaNum-Medium.ttf", weight: "500" },
    { path: "../fonts/PeydaFaNum-SemiBold.ttf", weight: "600" },
    { path: "../fonts/PeydaFaNum-Bold.ttf", weight: "700" },
    { path: "../fonts/PeydaFaNum-ExtraBold.ttf", weight: "800" },
    { path: "../fonts/PeydaFaNum-Black.ttf", weight: "900" },
  ],
  variable: "--font-fa-num",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
      className={`${peyda.variable} ${peydaFaNum.variable} ${inter.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
