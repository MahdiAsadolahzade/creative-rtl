import type { Metadata } from "next";
import { GuideShell, type GuideFaq } from "@/components/guides/GuideShell";
import { GuideExample } from "@/components/guides/GuideExample";

const path = "/guides/rtl-markdown";
const title = "Markdown راست‌چین (RTL): ترکیب فارسی و انگلیسی";
const description = "چطور متن ترکیبی فارسی و انگلیسی را در Markdown درست نمایش دهیم: جهت خودکار هر بلوک، کد، فرمول، لیست‌های دوزبانه و تنظیم دستی جهت.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description, url: path, type: "article", locale: "fa_IR" },
};

const faq: GuideFaq[] = [
  { question: "جهت هر پاراگراف چطور تعیین می‌شود؟", answer: "جهت هر بلوک جداگانه بر اساس غالب بودن حروف فارسی یا لاتین همان بلوک تعیین می‌شود. یک پاراگراف فارسی با یک اصطلاح انگلیسی راست‌چین می‌ماند." },
  { question: "اگر همه‌ی متن را LTR بخواهم چه کنم؟", answer: "در بالای ادیتور گزینه‌ی جهت متن را از «خودکار» به LTR تغییر دهید. این تنظیم برای کل سند اعمال می‌شود." },
  { question: "کد و فرمول در متن فارسی چطور نمایش داده می‌شوند؟", answer: "کد و فرمول LaTeX همیشه چپ‌به‌راست نمایش داده می‌شوند تا ترتیب نمادها بهم نخورد." },
  { question: "آیا URL و آدرس ایمیل درست نمایش داده می‌شود؟", answer: "بله. بخش‌های لاتین داخل متن فارسی جدا می‌شوند تا علامت‌های نقطه و اسلش در جای درست بمانند." },
];

const mixedExample = [
  "# راهنمای سریع",
  "",
  "این متن با Docker و Node.js 20 نوشته شده است.",
  "",
  "- نصب با `npm install`",
  "- مطالعه‌ی docs در https://example.com",
  "",
  "فرمول انرژی: $E = mc^2$",
].join("\n");

const listExample = [
  "- مورد فارسی",
  "- English item",
  "- ترکیب Persian و English",
].join("\n");

export default function RtlMarkdownGuide() {
  return (
    <GuideShell path={path} title={title} description={description} faq={faq}>
      <h2>جهت خودکار هر بلوک</h2>
      <p>
        در ادیتور، جهت پیش‌فرض «خودکار» است. هر پاراگراف، عنوان، لیست یا نقل‌قول جهت خودش را از محتوای خودش می‌گیرد،
        پس یک سند می‌تواند هم بخش‌های راست‌چین و هم چپ‌چین داشته باشد.
      </p>
      <GuideExample title="ترکیب بلوک‌های فارسی و انگلیسی" source={mixedExample} />

      <h2>لیست‌های دوزبانه</h2>
      <p>
        هر آیتم لیست جهت مستقل خودش را دارد. این کار باعث می‌شود آیتم انگلیسی در میان لیست فارسی به‌هم‌ریختگی ایجاد نکند.
      </p>
      <GuideExample title="لیست با آیتم‌های مختلط" source={listExample} />

      <h2>کد، فرمول و آدرس‌ها</h2>
      <p>
        بلوک کد و کد درون‌خطی همیشه LTR هستند. فرمول‌های <bdi dir="ltr">LaTeX</bdi> هم جداگانه نمایش داده می‌شوند تا
        ترتیب صورت و مخرج و نمادها حفظ شود. آدرس‌ها و نام فایل‌ها هم به‌صورت یک قطعه‌ی لاتین دیده می‌شوند.
      </p>

      <h2>تنظیم دستی جهت</h2>
      <p>
        اگر سندی کاملاً انگلیسی یا کاملاً فارسی است، جهت را ثابت کنید تا نتیجه قابل پیش‌بینی باشد.
        برای نوشته‌های بلند دوزبانه، حالت «خودکار» معمولاً بهترین انتخاب است.
      </p>

      <h2>خروجی PDF و تصویر</h2>
      <p>
        خروجی PDF و PNG با همان جهت‌ها و تراز ساخته می‌شود، بنابراین آنچه در پیش‌نمایش می‌بینید همان چیزی است که
        در فایل نهایی قرار می‌گیرد.
      </p>
    </GuideShell>
  );
}
