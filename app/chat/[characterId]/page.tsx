"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatWindow from "@/components/chat/ChatWindow";
import StudyPanel from "@/components/study/StudyPanel";
import ModeToggle, { type Mode } from "@/components/ModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { getCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function CharacterPage() {
  const params = useParams<{ characterId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("chat");

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setCharacter(undefined);
    setLoadError(null);

    getCharacter(params.characterId)
      .then((found) => {
        if (cancelled) return;
        setCharacter(found ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(t("characterPage.loadError"));
        setCharacter(null);
      });

    return () => {
      cancelled = true;
    };
  }, [params.characterId, authLoading, user?.id]);

  if (character === undefined) {
    return null;
  }

  if (character === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
        <h1 className="text-3xl font-bold text-ink">
          {loadError ? t("characterPage.errorTitle") : t("characterPage.notFoundTitle")}
        </h1>
        {loadError && <p className="text-base text-muted">{loadError}</p>}
        <Link
          href="/"
          className="text-base font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {t("common.backHome")}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-paper">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:gap-4">
        <Link
          href="/"
          className="shrink-0 text-base font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {t("common.back")}
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-ink">{character.name}</h1>
        <div className="shrink-0">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <LanguageSwitcher />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className={mode === "chat" ? "flex h-full min-h-0 flex-1 flex-col" : "hidden"}>
          <ChatWindow character={character} />
        </div>
        <div className={mode === "study" ? "flex h-full min-h-0 flex-1 flex-col" : "hidden"}>
          <StudyPanel character={character} />
        </div>
      </div>
    </main>
  );
}
