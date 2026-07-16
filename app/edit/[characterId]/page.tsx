"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CharacterForm from "@/components/character/CharacterForm";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { getCharacter, saveCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function EditCharacterPage() {
  const params = useParams<{ characterId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(data: Omit<Character, "id" | "createdAt">) {
    if (!character || isSubmitting) return;

    // Keep the original id/createdAt, and the isDefault flag in particular —
    // the form never round-trips it, but the default character must stay
    // recognizable (recreate-if-missing, hidden card personality, gentle
    // reminder) no matter how its fields are edited.
    const updated: Character = {
      ...data,
      id: character.id,
      createdAt: character.createdAt,
      isDefault: character.isDefault,
    };

    setIsSubmitting(true);
    setSaveError(null);

    try {
      await saveCharacter(updated);
      router.push("/");
    } catch {
      setSaveError(t("characterForm.saveError"));
      setIsSubmitting(false);
    }
  }

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
    <main className="flex min-h-screen flex-col bg-paper px-4 py-6">
      <Link
        href="/"
        className="text-base font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        {t("common.back")}
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">
          {t("characterForm.editCharacterTitle")}
        </h1>
        {saveError && (
          <p className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
            {saveError}
          </p>
        )}
        <CharacterForm
          initialValues={character}
          submitLabel={t("characterForm.saveChanges")}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
