"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { getCharacterDisplayName } from "@/lib/character";
import type { Character } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
  accent?: "sky" | "star";
}

const PERSONALITY_PREVIEW_LENGTH = 80;

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export default function CharacterCard({ character, onDelete, accent = "sky" }: CharacterCardProps) {
  const router = useRouter();
  const { t, tOrFallback } = useTranslation();

  function handleCardClick() {
    router.push(`/chat/${character.id}`);
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(character.id);
  }

  // The default character's personality is never shown (its card shows a
  // tagline instead), so it must never be looked up here either — otherwise
  // its hidden traits still hit the translation table on every render.
  const personalityPreview = character.isDefault
    ? ""
    : [
        ...character.personality.map((trait) =>
          tOrFallback(`characterForm.personality.${trait}`, trait)
        ),
        ...(character.personalityOther ? [character.personalityOther] : []),
      ].join(", ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-3xl border-2 border-t-4 border-line bg-paper p-5 pt-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg ${
        accent === "star" ? "border-t-star" : "border-t-sky"
      }`}
    >
      <h2 className="text-xl font-bold text-ink">{getCharacterDisplayName(character, t)}</h2>
      {character.isDefault ? (
        <p className="text-sm text-muted">{t("defaultCharacter.tagline")}</p>
      ) : (
        <>
          {character.relationship && (
            <p className="text-sm text-muted">
              {t("characterCard.relationshipLabel")}
              {character.relationship}
            </p>
          )}
          {personalityPreview && (
            <p className="text-sm text-muted">
              {truncate(personalityPreview, PERSONALITY_PREVIEW_LENGTH)}
            </p>
          )}
        </>
      )}

      <div className="absolute right-3 top-3 flex items-center gap-1">
        <Link
          href={`/edit/${character.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-full px-2.5 py-1 text-sm font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink"
        >
          {t("common.edit")}
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full px-2.5 py-1 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}
