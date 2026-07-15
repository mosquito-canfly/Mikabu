"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
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
  const { t } = useTranslation();

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

  const personalityPreview = [
    ...character.personality,
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
      <h2 className="text-xl font-bold text-ink">{character.name}</h2>
      {personalityPreview && (
        <p className="text-sm text-muted">
          {truncate(personalityPreview, PERSONALITY_PREVIEW_LENGTH)}
        </p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600"
      >
        {t("common.delete")}
      </button>
    </div>
  );
}
