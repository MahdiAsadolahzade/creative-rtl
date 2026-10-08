"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { mermaidConfig } from "@/lib/mermaid/config";

type MermaidBlockProps = { id: string; source: string; fallback: string };

let mermaidModule: typeof import("mermaid")["default"] | null = null;
let loading: Promise<typeof import("mermaid")["default"]> | null = null;

function loadMermaid() {
  if (mermaidModule) return Promise.resolve(mermaidModule);
  loading ??= import("mermaid").then((module) => {
    mermaidModule = module.default;
    return mermaidModule;
  });
  return loading;
}

export function MermaidBlock({ id, source, fallback }: MermaidBlockProps) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadMermaid().then(async (mermaid) => {
        await document.fonts.ready;
        const paper = ref.current?.closest<HTMLElement>(".paper") ?? document.querySelector<HTMLElement>(".paper");
        const styles = getComputedStyle(paper ?? document.body);
        mermaid.initialize(mermaidConfig(getComputedStyle(document.body).fontFamily, {
          background: styles.getPropertyValue("--paper-bg").trim(),
          foreground: styles.getPropertyValue("--paper-ink").trim(),
          primary: styles.getPropertyValue("--primary-strong").trim(),
          border: styles.getPropertyValue("--paper-rule").trim(),
        }));
        try {
          const renderId = `mermaid-${id.replace(/[^a-z0-9_-]/giu, "-")}`;
          const result = await mermaid.render(renderId, source);
          if (active) { setSvg(result.svg); setFailed(false); }
        } catch {
          if (active) setFailed(true);
        }
      });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [source]);

  return (
    <figure className="mermaid-block block" data-kind="mermaid" data-source={source} data-code-visible={showCode}>
      <button className="block-menu" type="button" data-action="menu" data-kind="mermaid" aria-haspopup="menu" aria-expanded="false" aria-label="گزینه‌های نمودار">⋯</button>
      <button type="button" className="sr-only" data-action="toggle-code" aria-pressed={showCode} onClick={() => setShowCode((visible) => !visible)}>تغییر نمایش نمودار</button>
      {showCode ? <pre dir="ltr"><code>{source}</code></pre> : failed ? <div className="mermaid-error"><strong>نمودار هنوز آماده نیست</strong><span>کد Mermaid را بررسی کنید و دوباره تلاش کنید.</span><button onClick={() => setShowCode(true)}>نمایش کد</button></div> : svg ? <div ref={ref} className="mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="mermaid-loading"><LoaderCircle size={20} /> در حال ساخت نمودار…</div>}
      {!svg && failed && <div className="sr-only" dangerouslySetInnerHTML={{ __html: fallback }} />}
    </figure>
  );
}
