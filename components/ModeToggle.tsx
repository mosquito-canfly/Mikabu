"use client";

import { useTranslation } from "@/lib/i18n/LocaleProvider";

export type Mode = "chat" | "study";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: { labelKey: string; value: Mode; accent: "star" | "sky" }[] = [
  { labelKey: "characterPage.modeChat", value: "chat", accent: "star" },
  { labelKey: "characterPage.modeStudy", value: "study", accent: "sky" },
];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-full border-2 border-line bg-paper p-1">
      {MODES.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-base font-medium transition-colors ${
              isActive
                ? `text-ink ${option.accent === "star" ? "bg-star" : "bg-sky"}`
                : "text-muted hover:text-ink hover:bg-line/40"
            }`}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
