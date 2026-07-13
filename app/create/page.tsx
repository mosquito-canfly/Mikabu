"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CharacterForm from "@/components/character/CharacterForm";
import { saveCharacter } from "@/lib/storage";
import type { Character } from "@/lib/types";

export default function CreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: Omit<Character, "id" | "createdAt">) {
    if (isSubmitting) return;

    const character: Character = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    setIsSubmitting(true);
    setError(null);

    try {
      await saveCharacter(character);
      router.push("/");
    } catch {
      setError("Couldn't save your character. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-paper px-4 py-6">
      <Link
        href="/"
        className="text-base font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        ← Back
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Create Character</h1>
        {error && (
          <p className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
            {error}
          </p>
        )}
        <CharacterForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
