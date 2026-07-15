"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function Logo() {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-2 font-bold text-ink">
      <Image
        src="/logo.png"
        alt=""
        width={500}
        height={500}
        priority
        className="h-[0.8em] w-[0.8em] shrink-0 object-contain"
      />
      {t("common.appName")}
    </span>
  );
}
