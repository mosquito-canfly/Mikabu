"use client";

import Link from "next/link";
import type { Character } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
}

const TRAITS_PREVIEW_LENGTH = 80;

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export default function CharacterCard({ character, onDelete }: CharacterCardProps) {
  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(character.id);
  }

  return (
    <Link
      href={`/chat/${character.id}`}
      className="relative flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 shadow-sm transition-colors hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <h2 className="text-lg font-semibold">{character.name}</h2>
      {character.traits && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {truncate(character.traits, TRAITS_PREVIEW_LENGTH)}
        </p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        Delete
      </button>
    </Link>
  );
}
