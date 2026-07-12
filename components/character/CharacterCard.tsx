"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
}

const PERSONALITY_PREVIEW_LENGTH = 80;

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export default function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const router = useRouter();

  function handleCardClick() {
    router.push(`/chat/${character.id}`);
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }

  function handleStudyClick(e: React.MouseEvent) {
    e.stopPropagation();
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
      className="relative flex cursor-pointer flex-col gap-2 rounded-xl border border-zinc-200 p-5 shadow-sm transition-colors hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <h2 className="text-lg font-semibold">{character.name}</h2>
      {personalityPreview && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {truncate(personalityPreview, PERSONALITY_PREVIEW_LENGTH)}
        </p>
      )}

      <div className="absolute right-3 top-3 flex items-center gap-1">
        <Link
          href={`/study/${character.id}`}
          onClick={handleStudyClick}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Study
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
