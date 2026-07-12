"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CharacterForm from "@/components/character/CharacterForm";
import { saveCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function CreatePage() {
  const router = useRouter();

  function handleSubmit(data: Omit<Character, "id" | "createdAt">) {
    const character: Character = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    saveCharacter(character);
    router.push("/");
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6">
      <Link
        href="/"
        className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <h1 className="text-3xl font-semibold">Create Character</h1>
        <CharacterForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
