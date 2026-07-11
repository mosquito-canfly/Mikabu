"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function ChatPage() {
  const params = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);

  useEffect(() => {
    setCharacter(getCharacter(params.characterId) ?? null);
  }, [params.characterId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      {character === undefined ? null : character === null ? (
        <h1 className="text-3xl font-semibold">Character not found</h1>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">{character.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chat coming soon.
          </p>
        </>
      )}
    </main>
  );
}
