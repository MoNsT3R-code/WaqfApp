/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ThreeBackground } from "./components/ThreeBackground";
import { Language } from "./translations";

export type Theme = "light" | "dark" | "system";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("waqf_theme") as Theme) || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const effectiveTheme = theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    
    root.setAttribute("data-theme", effectiveTheme);
    localStorage.setItem("waqf_theme", theme);
  }, [theme]);

  const startSession = async () => {
    const res = await fetch("/api/auth/guest", { method: "POST" });
    const data = await res.json();
    localStorage.setItem("waqf_token", data.token);
    setUser(data.user);
  };

  useEffect(() => {
    startSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("waqf_token");
    setUser(null);
    startSession();
  };

  return (
    <div className={`relative overflow-x-hidden selection:bg-[var(--accent)]/30 selection:text-[var(--text-p)] ${lang === "ur" || lang === "ar" ? "rtl" : "ltr"}`} dir={lang === "ur" || lang === "ar" ? "rtl" : "ltr"}>
      <ThreeBackground theme={theme} />
      <div className="relative z-10 transition-all duration-1000">
        {user && (
          <Dashboard onLogout={handleLogout} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} user={user} />
        )}
      </div>
    </div>
  );
}
