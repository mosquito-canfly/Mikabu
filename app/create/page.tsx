"use client";

import { useRouter } from "next/navigation";
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-3xl font-semibold">Create Character</h1>
      <CharacterForm onSubmit={handleSubmit} />
    </main>
  );
}
