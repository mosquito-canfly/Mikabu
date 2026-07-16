"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import en from "./en.json";
import zh from "./zh.json";

export type Locale = "en" | "zh";

export const LOCALES: Locale[] = ["en", "zh"];

const TRANSLATIONS: Record<Locale, unknown> = { en, zh };

const LOCALE_STORAGE_KEY = "mikabu:locale";

type TranslationParams = Record<string, string | number>;

function resolveKey(source: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
  tOrFallback: (key: string, fallback: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always starts as "en" so the server-rendered markup and the client's
  // first render match exactly (localStorage isn't available during SSR).
  // The persisted locale is applied a moment later, in the effect below —
  // imperceptible in practice, and the only way to avoid a hydration
  // mismatch without a blocking inline script.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const path = key.split(".");
      const value = resolveKey(TRANSLATIONS[locale], path) ?? resolveKey(TRANSLATIONS.en, path);
      if (typeof value !== "string") {
        console.error(`Missing translation for key: ${key}`);
        return key;
      }
      return interpolate(value, params);
    },
    [locale]
  );

  // For lookups where a miss is expected and not a bug — e.g. a stored
  // personality/speaking-style value that predates a preset rename, or free
  // text — so those don't spam console.error the way a genuinely missing UI
  // string should.
  const tOrFallback = useCallback(
    (key: string, fallback: string) => {
      const path = key.split(".");
      const value = resolveKey(TRANSLATIONS[locale], path) ?? resolveKey(TRANSLATIONS.en, path);
      return typeof value === "string" ? value : fallback;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tOrFallback }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return ctx;
}
