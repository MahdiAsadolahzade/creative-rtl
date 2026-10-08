"use client";

import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { /* Keep the global fallback side-effect free. */ }, []);
  return <html lang="fa" dir="rtl"><body><main className="error-page"><h1>یک خطای غیرمنتظره رخ داد.</h1><button className="primary-cta" onClick={() => reset()}>تلاش دوباره</button></main></body></html>;
}
