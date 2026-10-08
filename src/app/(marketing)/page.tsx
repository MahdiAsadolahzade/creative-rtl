import Link from "next/link";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/Logo";
import { Ltr } from "@/components/ui/Ltr";
import { renderDocument } from "@/lib/markdown/pipeline";
import { siteConfig } from "@/config/site";

const demoSource = `این متن با Docker، Node.js 20 و (C++) ساخته شده است.

- فارسی و English در یک لیست
- یک URL: https://example.com

> This is a mixed paragraph.

فرمول: $x^2 + y^2 = z^2$`;

const faq = [
  { question: "آیا متن من ذخیره می‌شود؟", answer: "متن برای رندر به سرور فرستاده می‌شود، اما ذخیره یا لاگ نمی‌شود. لینک اشتراک فقط محتوای فشرده را در بخش # آدرس نگه می‌دارد." },
  { question: "چرا جهت هر بلوک جداگانه تشخیص داده می‌شود؟", answer: "چون یک پاراگراف می‌تواند فارسی باشد و کد یا اصطلاح انگلیسی داشته باشد. creative-rtl جهت را برای هر بلوک مستقل محاسبه می‌کند." },
  { question: "آیا Mermaid و فرمول پشتیبانی می‌شوند؟", answer: "بله. نمودار Mermaid در مرورگر و Markdown و فرمول‌های LaTeX روی سرور رندر می‌شوند." },
];

async function getDemo() {
  "use cache";
  cacheLife("max");
  return renderDocument({ source: demoSource, mode: "markdown", dir: "auto" });
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, inLanguage: "fa" },
    { "@type": "WebApplication", name: siteConfig.name, applicationCategory: "DeveloperApplication", operatingSystem: "Web", inLanguage: "fa", offers: { "@type": "Offer", price: 0, priceCurrency: "USD" }, featureList: ["تشخیص خودکار RTL و LTR", "Mermaid", "فرمول‌های ریاضی", "رندر Markdown"] },
    { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
  ],
};

export default async function LandingPage() {
  const demo = await getDemo();
  const renderedDemo = demo.blocks.map((block) => block.html).join("");
  return (
    <main className="editorial-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
      <section className="editorial-hero">
        <div className="hero-copy">
          <p className="section-index">۰۱ / ابزار ویراستاری برای وب</p>
          <h1><Ltr>Markdown</Ltr> که فقط کار می‌کند — <span><bdi dir="ltr">RTL و LTR.</bdi></span></h1>
          <p className="hero-lede">رندر زیبای Markdown برای متن‌های ترکیبی فارسی و انگلیسی؛ از متن درهم‌ریخته تا خروجی مرتب، با جهت درست برای هر بلوک.</p>
          <div className="hero-actions"><Link className="primary-cta" href="/editor">همین حالا امتحان کن <ArrowLeft size={17} /></Link><a className="secondary-cta" href={siteConfig.repoUrl} target="_blank" rel="noreferrer">مشاهده در GitHub</a></div>
          <p className="privacy-note"><Check size={16} /> متن شما ذخیره یا لاگ نمی‌شود؛ فقط برای رندر به سرور می‌رود.</p>
        </div>
        <ComparisonDemo rendered={renderedDemo} />
      </section>

      <section className="editorial-features" id="features">
        <div className="editorial-section-label"><span>۰۲</span><p>چرا creative-rtl</p></div>
        <div className="feature-grid">
          <EditorialFeature number="۰۱" title="تشخیص خودکار RTL/LTR" text="هر پاراگراف، تیتر، آیتم و سلول جدول مسیر خودش را پیدا می‌کند." />
          <EditorialFeature number="۰۲" title="زبان‌های ترکیبی" text="فارسی، عربی، انگلیسی و کد کنار هم، بدون جابه‌جایی علائم." />
          <EditorialFeature number="۰۳" title="Mermaid و فرمول" text="نمودار و ریاضی، با خروجی خوانا و خطای مستقل." />
          <EditorialFeature number="۰۴" title="رایگان و متن‌باز" text="متن برای رندر ارسال می‌شود؛ ذخیره و لاگ نمی‌شود." />
        </div>
      </section>

      <section className="live-editor-section" id="how">
        <div className="editorial-section-label"><span>۰۳</span><p>پیش‌نمایش زنده</p></div>
        <div className="live-editor-copy"><h2>متن را وارد کن، جهت درست را ببین.</h2><p>یک ادیتور آرام برای زمانی که متن باید دقیق خوانده شود، نه فقط زیبا به نظر برسد.</p><Link href="/editor">باز کردن ادیتور <ArrowLeft size={16} /></Link></div>
        <div className="live-editor-frame"><div className="live-editor-bar"><Logo variant="wordmark" size="sm" /><span><b>●</b> RTL Auto</span></div><div className="live-editor-body"><pre dir="ltr">{demoSource}</pre><article className="live-editor-paper" dangerouslySetInnerHTML={{ __html: renderedDemo }} /></div></div>
      </section>

      <section className="flow-section">
        <div className="editorial-section-label"><span>۰۴</span><p>سه ورودی، یک خروجی مرتب</p></div>
        <div className="flow-list"><FlowItem number="۱" title="Paste از ChatGPT" text="متن ترکیبی را همان‌طور که هست وارد کن." /><FlowItem number="۲" title="README فارسی" text="کد و توضیح را در یک کاغذ خوانا ببین." /><FlowItem number="۳" title="نمودار و فرمول" text="خروجی را برای Docs، Word یا PDF بردار." /></div>
      </section>

      <section className="faq-section editorial-faq" id="faq"><div className="editorial-section-label"><span>۰۵</span><p>پرسش‌های متداول</p></div><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="editorial-cta"><div><p className="section-index">همان متن. جهت درست.</p><h2>برای متن بعدی آماده‌ای؟</h2></div><Link className="primary-cta" href="/editor">شروع رایگان <ExternalLink size={16} /></Link></section>
    </main>
  );
}

function ComparisonDemo({ rendered }: { rendered: string }) {
  return <div className="comparison-demo"><div className="comparison-heading"><span>یک متن، دو نتیجه</span><span className="comparison-note">مقایسه‌ی واقعی</span></div><div className="comparison-columns"><div className="comparison-column comparison-column--naive"><h3>مرورگر معمولی</h3><p>جهت پیش‌فرض صفحه روی همه‌چیز اثر می‌گذارد.</p><div className="naive-result">English with test a is This<br />نسخه‌ی 02 Node.js<br />z = y + x</div></div><div className="comparison-column comparison-column--correct"><h3><Ltr>creative-rtl</Ltr></h3><p>هر بلوک و هر Run جهت صریح دارد.</p><div className="correct-result" dangerouslySetInnerHTML={{ __html: rendered }} /></div></div><Link className="comparison-link" href="/editor">همین متن را در ادیتور باز کن <ArrowLeft size={15} /></Link></div>;
}

function EditorialFeature({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="editorial-feature"><span className="feature-number">{number}</span><h3>{title}</h3><p>{text}</p></article>;
}

function FlowItem({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="flow-item"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowLeft size={17} /></article>;
}
