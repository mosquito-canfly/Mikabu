"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import NotesUpload from "@/components/study/NotesUpload";
import StudyToolbar from "@/components/study/StudyToolbar";
import QuizView from "@/components/study/QuizView";
import { getCharacter } from "@/lib/storage";
import type { Character, QuizQuestion, StudyTool } from "@/lib/types";

type StudyResult =
  | { type: "text"; text: string }
  | { type: "quiz"; questions: QuizQuestion[] };

export default function StudyPage() {
  const params = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCharacter(getCharacter(params.characterId) ?? null);
  }, [params.characterId]);

  async function handleSelectTool(tool: StudyTool) {
    if (!character) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, tool, notes }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      if (tool === "quiz") {
        const data: { questions: QuizQuestion[] } = await response.json();
        setResult({ type: "quiz", questions: data.questions });
      } else {
        const data: { text: string } = await response.json();
        setResult({ type: "text", text: data.text });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold">Study with {character.name}</h1>
      </header>

      <NotesUpload value={notes} onChange={setNotes} />
      <StudyToolbar onSelect={handleSelectTool} disabled={isLoading} />

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {character.name} is working on it...
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result?.type === "text" && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</p>
      )}

      {result?.type === "quiz" && <QuizView questions={result.questions} />}
    </main>
  );
}
