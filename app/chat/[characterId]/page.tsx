"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatWindow from "@/components/chat/ChatWindow";
import { getCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function ChatPage() {
  const params = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);

  useEffect(() => {
    setCharacter(getCharacter(params.characterId) ?? null);
  }, [params.characterId]);

  if (character === undefined) {
    return null;
  }

  if (character === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-3xl font-semibold">Character not found</h1>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold">{character.name}</h1>
      </header>

      <ChatWindow character={character} />
    </main>
  );
}
