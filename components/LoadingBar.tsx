"use client";

import { useTranslation } from "@/lib/i18n/LocaleProvider";

interface LoadingBarProps {
  active: boolean;
  accent: "sky" | "star";
}

export default function LoadingBar({ active, accent }: LoadingBarProps) {
  const { t } = useTranslation();
  if (!active) return null;

  return (
    <div role="progressbar" aria-busy="true" aria-label={t("common.loading")} className="mikabu-loading-track w-full">
      <div className={`mikabu-loading-segment ${accent === "star" ? "bg-star" : "bg-sky"}`} />
    </div>
  );
}
