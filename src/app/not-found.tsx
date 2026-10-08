import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return <main className="error-page"><Logo size="lg" /><p>این صفحه پیدا نشد.</p><Link className="primary-cta" href="/">بازگشت به خانه</Link></main>;
}
