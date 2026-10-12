"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as Popover from "@radix-ui/react-popover";
import { Check, GripVertical, Moon, Settings2, Sun } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ComboBox } from "@/components/ui/ComboBox";
import { DirectionChip } from "@/components/ui/DirectionChip";
import { documentDirection } from "@/lib/bidi/direction";
import type { DirectionMode } from "@/lib/bidi/types";
import type { RenderResponse } from "@/lib/markdown/types";
import { decodeShare, encodeShare } from "@/features/share/encode";
import { MermaidBlock } from "@/features/preview/MermaidBlock";
import { ExportActions } from "@/features/export/ExportActions";
import { InputActions } from "@/features/export/InputActions";

const CodeMirrorEditor = dynamic(
  () => import("./CodeMirrorEditor").then((module) => module.CodeMirrorEditor),
  { ssr: false, loading: () => <div className="editor-skeleton" aria-label="در حال آماده‌سازی ادیتور" /> },
);

const SAMPLE = `# سلام، Hello 👋

این یک پیش‌نمایش **Markdown** برای متن‌های ترکیبی است.

## قابلیت‌ها

- تشخیص خودکار RTL / LTR
- پشتیبانی از \`Node.js\` و \`C++\`
- فرمول: $x^2 + y^2 = z^2$

> This is a test with English
> و فارسی در یک نقل‌قول.

\`\`\`mermaid
flowchart LR
  A[شروع] --> B{تشخیص جهت}
  B --> C[پیش‌نمایش زیبا]
\`\`\`
`;

type Paper = "white" | "warm" | "dark";
type MobileTab = "input" | "preview";
type SoftBreaks = "markdown" | "preserve";

const renderWarnings: Record<string, string> = {
  "markdown-in-html": "این متن جدول Markdown دارد اما حالت HTML انتخاب شده است. برای نمایش جدول، حالت Markdown را انتخاب کنید.",
};
type NestedMode = "preview" | "source";

export function EditorShell() {
  const [source, setSource] = useState(SAMPLE);
  const [mode, setMode] = useState<"markdown" | "html">("markdown");
  const [dirMode, setDirMode] = useState<DirectionMode>("auto");
  const [paper, setPaper] = useState<Paper>("white");
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [softBreaks, setSoftBreaks] = useState<SoftBreaks>("markdown");
  const [nestedMarkdown, setNestedMarkdown] = useState<NestedMode>("preview");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileTab, setMobileTab] = useState<MobileTab>("input");
  const [split, setSplit] = useState(50);
  const [rendered, setRendered] = useState<RenderResponse | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [dividerOpen, setDividerOpen] = useState(false);
  const requestId = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const dividerDragged = useRef(false);

  const localMeta = useMemo(() => documentDirection(source, dirMode), [source, dirMode]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("creative-rtl:v1:doc");
      const prefs = localStorage.getItem("creative-rtl:v1:prefs");
      if (saved) {
        const value = JSON.parse(saved) as { source?: string; mode?: "markdown" | "html" };
        if (typeof value.source === "string") setSource(value.source);
        if (value.mode) setMode(value.mode);
      }
      if (prefs) {
        const value = JSON.parse(prefs) as { dirMode?: DirectionMode; paper?: Paper; pageSize?: "A4" | "Letter"; theme?: "dark" | "light"; panelSplit?: number; softBreaks?: SoftBreaks; nestedMarkdown?: NestedMode };
        if (value.dirMode) setDirMode(value.dirMode);
        if (value.paper) setPaper(value.paper);
        if (value.pageSize) setPageSize(value.pageSize);
        if (value.theme) setTheme(value.theme);
        if (typeof value.panelSplit === "number") setSplit(value.panelSplit);
        if (value.softBreaks) setSoftBreaks(value.softBreaks);
        if (value.nestedMarkdown) setNestedMarkdown(value.nestedMarkdown);
      }
      const hash = window.location.hash.slice(1);
      if (hash) void decodeShare(hash).then((value) => {
        if (value) {
          localStorage.setItem("creative-rtl:v1:previous", JSON.stringify({ source, mode }));
          setSource(value.s);
          setMode(value.m);
          setDirMode(value.d);
        }
      });
    } catch {
      // localStorage is optional.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem("creative-rtl:v1:doc", JSON.stringify({ source, mode }));
        localStorage.setItem("creative-rtl:v1:prefs", JSON.stringify({ dirMode, paper, pageSize, theme, panelSplit: split, softBreaks, nestedMarkdown }));
      } catch {
        // Persistence is best effort.
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [source, mode, dirMode, paper, pageSize, theme, split, softBreaks, nestedMarkdown]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = ++requestId.current;
      const controller = new AbortController();
      setRendering(true);
      setError("");
      fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, mode, dir: dirMode, softBreaks, nestedMarkdown }),
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error("render");
        return response.json() as Promise<RenderResponse>;
      }).then((value) => {
        if (current === requestId.current) setRendered(value);
      }).catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        if (current === requestId.current) setError("خطا در رندر — تلاش مجدد");
      }).finally(() => {
        if (current === requestId.current) setRendering(false);
      });
      return () => controller.abort();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [source, mode, dirMode, softBreaks, nestedMarkdown]);

  const copy = useCallback(async (text: string, html?: string) => {
    try {
      if (html && "ClipboardItem" in window && navigator.clipboard.write) {
        const item = new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      setError("کپی انجام نشد");
    }
  }, []);

  const copyShare = useCallback(async () => {
    const value = await encodeShare({ s: source, m: mode, d: dirMode, p: paper });
    const url = `${window.location.origin}/editor#${value}`;
    await copy(url);
    window.history.replaceState(null, "", `#${value}`);
  }, [copy, dirMode, mode, paper, source]);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    setFeedback({ message, tone });
    window.setTimeout(() => setFeedback(null), 4000);
  }, []);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const onAction = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (action === "menu") {
        const block = target.closest<HTMLElement>(".block, .mermaid-block, .nested-md");
        if (!block) return;
        const currentMenu = block.querySelector<HTMLElement>(".block-menu-popover");
        container.querySelectorAll<HTMLElement>(".block-menu-popover").forEach((menu) => menu.remove());
        container.querySelectorAll<HTMLElement>("[data-action='menu']").forEach((button) => button.setAttribute("aria-expanded", "false"));
        if (currentMenu) return;
        const trigger = target.closest<HTMLElement>("[data-action='menu']");
        trigger?.setAttribute("aria-expanded", "true");
        const menu = document.createElement("div");
        menu.className = "block-menu-popover";
        menu.setAttribute("role", "menu");
        const kind = block.dataset.kind ?? "code";
        const code = block.querySelector("code")?.textContent ?? block.dataset.source ?? "";
        const actions = [
          { label: "کپی کد", run: () => void copy(code) },
          ...(kind === "mermaid" ? [{
            label: block.dataset.codeVisible === "true" ? "نمایش نمودار" : "نمایش کد",
            run: () => block.querySelector<HTMLButtonElement>("[data-action='toggle-code']")?.click(),
          }] : []),
        ];
        actions.forEach(({ label, run }) => {
          const menuButton = document.createElement("button");
          menuButton.type = "button";
          menuButton.setAttribute("role", "menuitem");
          menuButton.textContent = label;
          menuButton.addEventListener("click", () => {
            run();
            menu.remove();
            trigger?.setAttribute("aria-expanded", "false");
            trigger?.focus();
          });
          menu.append(menuButton);
        });
        block.append(menu);
        menu.querySelector<HTMLButtonElement>("button")?.focus();
        return;
      }
      if (action === "nested-toggle") {
        const figure = target.closest<HTMLElement>(".nested-md");
        if (figure) figure.dataset.view = figure.dataset.view === "source" ? "preview" : "source";
      }
      if (action === "copy-code") {
        const code = target.closest<HTMLElement>(".code-block, .nested-md")?.querySelector("code")?.textContent ?? "";
        void copy(code);
      }
    };
    const onOutsidePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.contains(event.target)) {
        container.querySelectorAll(".block-menu-popover").forEach((menu) => menu.remove());
        container.querySelectorAll<HTMLElement>("[data-action='menu']").forEach((button) => button.setAttribute("aria-expanded", "false"));
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const menu = container.querySelector<HTMLElement>(".block-menu-popover");
      if (!menu) return;
      menu.remove();
      const trigger = container.querySelector<HTMLElement>("[data-action='menu'][aria-expanded='true']");
      trigger?.setAttribute("aria-expanded", "false");
      trigger?.focus();
    };
    container.addEventListener("click", onAction);
    document.addEventListener("pointerdown", onOutsidePointerDown);
    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("click", onAction);
      document.removeEventListener("pointerdown", onOutsidePointerDown);
      container.removeEventListener("keydown", onKeyDown);
    };
  }, [copy]);

  return (
    <div className="editor-app" data-theme={theme} data-paper={paper}>
      <header className="editor-topbar">
        <Logo size="sm" />
        <div className="topbar-tabs" role="tablist" aria-label="نوع ورودی">
          <button className={mode === "markdown" ? "is-active" : ""} onClick={() => setMode("markdown")}>Markdown</button>
          <button className={mode === "html" ? "is-active" : ""} onClick={() => setMode("html")}>HTML</button>
        </div>
        <div className="topbar-actions">
          <ComboBox
            value={dirMode}
            onChange={setDirMode}
            ariaLabel="جهت متن"
            className="direction-combo"
            prefix={<span className="status-dot" aria-hidden="true" />}
            options={[
              { value: "auto", label: "خودکار" },
              { value: "rtl", label: "RTL" },
              { value: "ltr", label: "LTR" },
            ]}
          />
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="تغییر تم">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <Popover.Root>
            <Popover.Trigger asChild><button className="icon-button" aria-label="تنظیمات"><Settings2 size={17} /></button></Popover.Trigger>
            <Popover.Portal><Popover.Content className="popover-panel settings-panel" sideOffset={8} align="end" dir="rtl">
              <strong>تنظیمات نمایش</strong>
              <label>کاغذ
                <ComboBox value={paper} onChange={setPaper} ariaLabel="کاغذ" options={[
                  { value: "white", label: "سفید" },
                  { value: "warm", label: "گرم" },
                  { value: "dark", label: "تیره" },
                ]} />
              </label>
              <label>اندازه خروجی
                <ComboBox value={pageSize} onChange={setPageSize} ariaLabel="اندازه خروجی" options={[
                  { value: "A4", label: "A4" },
                  { value: "Letter", label: "Letter" },
                ]} />
              </label>
              <label>شکست خط
                <ComboBox value={softBreaks} onChange={setSoftBreaks} ariaLabel="شکست خط" options={[
                  { value: "markdown", label: "استاندارد Markdown" },
                  { value: "preserve", label: "هر Enter یک خط" },
                ]} />
              </label>
              <label>Markdown تو‌در‌تو
                <ComboBox value={nestedMarkdown} onChange={setNestedMarkdown} ariaLabel="Markdown تو‌در‌تو" options={[
                  { value: "preview", label: "پیش‌نمایش" },
                  { value: "source", label: "کد منبع" },
                ]} />
              </label>
            </Popover.Content></Popover.Portal>
          </Popover.Root>
          <ExportActions
            settings={{
              source,
              mode,
              dir: dirMode,
              softBreaks,
              nestedMarkdown,
              paper,
              pageSize,
              title: rendered?.meta.headings.find((heading) => heading.depth === 1)?.text,
            }}
            previewRef={previewRef}
            onCopyShare={copyShare}
            onMessage={notify}
          />
        </div>
        {feedback && <div className={`editor-feedback editor-feedback--${feedback.tone}`} role="status">{feedback.message}</div>}
      </header>
      <div className="mobile-tabs" role="tablist">
        <button className={mobileTab === "input" ? "is-active" : ""} onClick={() => setMobileTab("input")}>ورودی</button>
        <button className={mobileTab === "preview" ? "is-active" : ""} onClick={() => setMobileTab("preview")}>پیش‌نمایش</button>
      </div>
      <section ref={workspaceRef} className="editor-workspace" style={{ "--panel-split": `${split}%` } as React.CSSProperties}>
        <div className={`editor-panel input-panel ${mobileTab === "input" ? "mobile-visible" : ""}`}>
          <div className="panel-heading"><div><span>ورودی</span></div><div className="panel-heading-actions"><span className="char-count num">{new Intl.NumberFormat("fa-IR").format(source.length)} نویسه</span><InputActions source={source} onMessage={notify} /></div></div>
          <CodeMirrorEditor value={source} onChange={setSource} theme={theme} />
          <footer className="panel-footer"><DirectionChip meta={localMeta} mode={dirMode} /><span>{rendering ? "در حال رندر…" : mode === "markdown" ? "Markdown" : "HTML"}</span></footer>
        </div>
        <Popover.Root open={dividerOpen} onOpenChange={setDividerOpen}>
          <Popover.Trigger asChild><button className="panel-divider" role="separator" aria-label="تغییر اندازه پنل‌ها" aria-valuemin={30} aria-valuemax={70} aria-valuenow={split} aria-valuetext={`${Math.round(split)}٪ ورودی`} onPointerDown={(event) => {
            const workspace = workspaceRef.current;
            if (!workspace) return;
            dividerDragged.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
            const startX = event.clientX;
            const isRtl = getComputedStyle(workspace).direction === "rtl";
            const move = (moveEvent: PointerEvent) => {
              if (Math.abs(moveEvent.clientX - startX) > 3) dividerDragged.current = true;
              const rect = workspace.getBoundingClientRect();
              const next = (isRtl
                ? (rect.right - moveEvent.clientX)
                : (moveEvent.clientX - rect.left)) / rect.width * 100;
              setSplit(Math.min(70, Math.max(30, next)));
            };
            const stop = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", stop);
              window.removeEventListener("pointercancel", stop);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", stop, { once: true });
            window.addEventListener("pointercancel", stop, { once: true });
          }} onKeyDown={(event) => {
          const isRtl = getComputedStyle(workspaceRef.current ?? document.documentElement).direction === "rtl";
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setSplit(event.key === "Home" ? 30 : 70);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const growsInlineStart = isRtl ? event.key === "ArrowLeft" : event.key === "ArrowRight";
            setSplit((value) => Math.min(70, Math.max(30, value + (growsInlineStart ? 5 : -5))));
          }
          }} onClick={(event) => {
            if (dividerDragged.current) {
              event.preventDefault();
              event.stopPropagation();
              dividerDragged.current = false;
            }
          }}><GripVertical size={18} aria-hidden="true" /></button></Popover.Trigger>
          <Popover.Portal><Popover.Content className="popover-panel direction-panel" sideOffset={8} dir="rtl">
            <strong>جهت متن</strong>
            {(["auto", "rtl", "ltr"] as DirectionMode[]).map((value) => <button key={value} className={dirMode === value ? "is-selected" : ""} onClick={() => { setDirMode(value); setDividerOpen(false); }}>{value === "auto" ? "خودکار" : value.toUpperCase()} {dirMode === value && <Check size={14} />}</button>)}
          </Popover.Content></Popover.Portal>
        </Popover.Root>
        <div className={`editor-panel preview-panel ${mobileTab === "preview" ? "mobile-visible" : ""}`}>
          <div className="panel-heading"><div><span>پیش‌نمایش</span></div><DirectionChip meta={rendered?.meta.direction ?? localMeta} mode={dirMode} compact /></div>
          <div ref={previewRef} className="preview-scroll">
            {error && <div className="render-error" role="status">{error}</div>}
            {rendered?.meta.warnings.map((code) => <div key={code} className="render-warning" role="note">{renderWarnings[code] ?? code}</div>)}
            <article className="paper print-root" data-paper={paper}>
              {rendered?.blocks.map((block) => block.kind === "mermaid" && block.mermaid
                ? <MermaidBlock key={block.id} id={block.id} source={block.mermaid.source} fallback={block.html} />
                : <div key={block.id} dir={block.dir} dangerouslySetInnerHTML={{ __html: block.html }} />)}
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
