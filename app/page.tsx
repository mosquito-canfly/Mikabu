"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
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
          <h1 className="text-4xl sm:text-5xl">
            <Logo />
          </h1>
          <p className="mt-2 text-lg text-muted">Your character, your story</p>
        </div>
        {characters.length > 0 && (
          <Link
            href="/create"
            className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
          >
            New Character
          </Link>
        )}
      </header>

      {characters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-line py-24 text-center">
          <p className="text-xl font-bold text-ink">Create your own character now!</p>
          <Link
            href="/create"
            className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
          >
            New Character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character, index) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDelete}
              accent={index % 2 === 0 ? "sky" : "star"}
            />
          ))}
        </div>
      )}
    </main>
  );
}
