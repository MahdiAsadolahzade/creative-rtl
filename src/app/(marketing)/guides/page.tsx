import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "@/components/guides/GuideShell";

const path = "/guides";
const title = "راهنماهای Markdown فارسی";
const description = "راهنماهای عملی برای نوشتن و نمایش Markdown فارسی و انگلیسی: جدول، جهت راست‌چین و قالب‌بندی.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description, url: path, locale: "fa_IR" },
};

const guides = [
  { href: "/guides/markdown-tables-persian", title: "جدول Markdown فارسی", summary: "ساخت جدول، تراز ستون‌ها، جدول‌های عریض و خطاهای رایج." },
  { href: "/guides/rtl-markdown", title: "Markdown راست‌چین (RTL)", summary: "ترکیب فارسی و انگلیسی، کد، فرمول و تنظیم جهت." },
];

export default function GuidesIndex() {
  return (
    <GuideShell path={path} title={title} description={description}>
      <ul className="guide-index">
        {guides.map((guide) => (
          <li key={guide.href}>
            <Link href={guide.href}>{guide.title}</Link>
            <p>{guide.summary}</p>
          </li>
        ))}
      </ul>
    </GuideShell>
  );
}
