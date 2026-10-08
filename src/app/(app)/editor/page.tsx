import type { Metadata } from "next";
import { EditorShell } from "@/features/editor/EditorShell";

export const metadata: Metadata = {
  title: "ادیتور Markdown",
  description: "متن ترکیبی فارسی و انگلیسی خود را با جهت درست پیش‌نمایش کنید.",
  alternates: { canonical: "/editor" },
};

export default function EditorPage() {
  return (
    <main className="editor-route">
      <h1 className="sr-only">پیش‌نمایش Markdown با تشخیص خودکار RTL و LTR</h1>
      <p className="sr-only">متن خود را وارد کنید تا همان لحظه روی کاغذی خوانا و مرتب نمایش داده شود.</p>
      <EditorShell />
      <noscript>برای استفاده از ادیتور، جاوااسکریپت مرورگر را فعال کنید.</noscript>
    </main>
  );
}
