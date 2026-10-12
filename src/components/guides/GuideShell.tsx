import Link from "next/link";
import { siteConfig } from "@/config/site";

export type GuideFaq = { question: string; answer: string };

type GuideShellProps = {
  path: string;
  title: string;
  description: string;
  faq?: GuideFaq[];
  children: React.ReactNode;
};

export function GuideShell({ path, title, description, faq = [], children }: GuideShellProps) {
  const url = `${siteConfig.url}${path}`;
  const graph: object[] = [
    {
      "@type": "Article",
      headline: title,
      description,
      inLanguage: "fa",
      url,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: siteConfig.name },
      publisher: { "@type": "Organization", name: siteConfig.name },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "راهنماها", item: `${siteConfig.url}/guides` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];
  if (faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main className="guide">
        <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
          <Link href="/">خانه</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/guides">راهنماها</Link>
          <span aria-hidden="true"> / </span>
          <span>{title}</span>
        </nav>
        <h1>{title}</h1>
        <p className="guide-lead">{description}</p>
        <div className="guide-body">{children}</div>
        {faq.length > 0 && (
          <section className="guide-faq" aria-labelledby="guide-faq-title">
            <h2 id="guide-faq-title">پرسش‌های متداول</h2>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        )}
        <aside className="guide-cta">
          <p>همین نمونه‌ها را خودتان در ادیتور امتحان کنید.</p>
          <Link className="header-cta" href="/editor">باز کردن ادیتور <span>←</span></Link>
        </aside>
      </main>
    </>
  );
}
