"use client";

import { useState, useEffect } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import type { FullData } from "@/lib/types";
import Guide from "@/components/Guide";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";

function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("fp-theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2.5 rounded-xl glass hover:scale-105 transition-all"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ko" ? "en" : "ko")}
      className="px-3 py-2 text-xs font-bold tracking-wider rounded-xl glass hover:scale-105 transition-all"
    >
      {lang === "ko" ? "EN" : "KO"}
    </button>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-black gradient-text tracking-tight">
          Followprint
        </span>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative pt-24 pb-16 text-center overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-violet-500/10 dark:border-violet-400/5" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full border border-pink-500/10 dark:border-pink-400/5" />

      <div className="relative z-10">
        <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-medium text-violet-600 dark:text-violet-400 mb-6 animate-fade-in">
          100% Private &middot; No Server
        </div>

        <h2 className="text-5xl sm:text-7xl font-black gradient-text mb-6 tracking-tight leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
          {t("hero.title")}
        </h2>

        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "200ms" }}>
          {t("hero.subtitle")}
        </p>

        <a
          href="#guide"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 transition-all animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          {t("hero.cta")}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 py-10 px-4 text-center">
      <div className="glass rounded-2xl max-w-md mx-auto py-6 px-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
          </svg>
          <p className="text-sm font-medium">{t("footer.privacy")}</p>
        </div>
      </div>
    </footer>
  );
}

function BackgroundOrbs() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}

function AppContent() {
  const [result, setResult] = useState<FullData | null>(null);

  return (
    <div className="relative min-h-screen">
      <BackgroundOrbs />
      <Header />
      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-12">
        {!result ? (
          <>
            <Hero />
            <Guide />
            <FileUpload onResult={setResult} />
          </>
        ) : (
          <Dashboard
            data={result.analysis}
            insights={result.insights}
            onReset={() => setResult(null)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
