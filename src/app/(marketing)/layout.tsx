import Link from "next/link";
import { GitBranch, Scale } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { siteConfig } from "@/config/site";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="marketing-shell" data-theme="light">
      <header className="site-header">
        <Link href="/" aria-label="صفحه اصلی creative-rtl"><Logo size="sm" /></Link>
        <nav aria-label="ناوبری اصلی">
          <a href="#features">ویژگی‌ها</a><a href="#how">چطور کار می‌کند</a><a href="#faq">پرسش‌ها</a><a href="#support">حمایت</a><a href={siteConfig.repoUrl} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <div className="header-actions"><ThemeToggle /><Link className="header-cta" href="/editor">امتحان کنید <span>←</span></Link></div>
      </header>
      {children}
      <footer className="site-footer">
        <div><Logo size="sm" /><p>همان متن. جهت درست.</p></div>
        <div className="footer-links"><a href="#features">ویژگی‌ها</a><a href="#faq">پرسش‌های متداول</a><a href="#support">حمایت</a><a href={siteConfig.contributeUrl} target="_blank" rel="noreferrer">مشارکت</a></div>
        <div className="footer-social"><a href={siteConfig.repoUrl} aria-label="GitHub"><GitBranch size={17} /></a><a href={`${siteConfig.repoUrl}/blob/master/LICENSE`} aria-label="MIT License"><Scale size={16} /></a><span>ساخته‌شده برای متن‌های ترکیبی</span></div>
      </footer>
    </div>
  );
}
