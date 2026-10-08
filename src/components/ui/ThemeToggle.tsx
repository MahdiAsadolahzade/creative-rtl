"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.querySelector<HTMLElement>(".marketing-shell")?.setAttribute("data-theme", next ? "dark" : "light");
    try {
      const current = JSON.parse(localStorage.getItem("creative-rtl:v1:prefs") ?? "{}") as Record<string, unknown>;
      localStorage.setItem("creative-rtl:v1:prefs", JSON.stringify({ ...current, theme: next ? "dark" : "light" }));
    } catch {
      // Theme persistence is best effort.
    }
  };
  return <button className="theme-toggle" onClick={toggle} aria-label={dark ? "تم روشن" : "تم تیره"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
