"use client";

import { LOCALES, useTranslation } from "@/lib/i18n/LocaleProvider";

// Deliberately neutral (bg-line, not bg-sky/bg-star) — this is a device-level
// preference, not tied to chat/study mode, and stays visually minor next to
// the primary actions per the design system's accent usage.
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("language.switchLabel")}
      className="inline-flex w-fit shrink-0 items-center gap-0.5 rounded-full border-2 border-line bg-paper p-0.5"
    >
      {LOCALES.map((option) => {
        const isActive = locale === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLocale(option)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line ${
              isActive ? "bg-line text-ink" : "text-muted hover:bg-line/40 hover:text-ink"
            }`}
          >
            {t(`language.${option}`)}
          </button>
        );
      })}
    </div>
  );
}
