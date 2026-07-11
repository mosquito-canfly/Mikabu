"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CharacterCard from "@/components/character/CharacterCard";
import { deleteCharacter, getCharacters } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    setCharacters(getCharacters());
  }, []);

  function handleDelete(id: string) {
    deleteCharacter(id);
    setCharacters((prev) => prev.filter((character) => character.id !== id));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-16">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Mikabu</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Your personalized AI companions, ready to chat.
          </p>
        </div>
        <Link
          href="/create"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          New Character
        </Link>
      </header>

      {characters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 py-24 text-center dark:border-zinc-700">
          <p className="text-lg font-medium">No characters yet</p>
          <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Create your first character to start chatting with them.
          </p>
          <Link
            href="/create"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Create your first character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}
