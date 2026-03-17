"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import en from "@/locales/en.json";
import ko from "@/locales/ko.json";

export type Lang = "en" | "ko";

const translations: Record<Lang, Record<string, unknown>> = { en, ko };

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp-lang") as Lang;
      if (saved && (saved === "en" || saved === "ko")) return saved;
      return navigator.language.startsWith("ko") ? "ko" : "en";
    }
    return "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("fp-lang", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: unknown = translations[lang];
      for (const k of keys) {
        if (typeof value !== "object" || value === null) return key;
        value = (value as Record<string, unknown>)[k];
      }
      return typeof value === "string" ? value : key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
