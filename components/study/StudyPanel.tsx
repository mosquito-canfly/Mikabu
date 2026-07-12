"use client";

import { useState } from "react";
import NotesUpload from "@/components/study/NotesUpload";
import StudyToolbar from "@/components/study/StudyToolbar";
import QuizView from "@/components/study/QuizView";
import type { Character, QuizQuestion, StudyTool } from "@/lib/types";

interface StudyPanelProps {
  character: Character;
}

type StudyResult =
  | { type: "text"; text: string }
  | { type: "quiz"; questions: QuizQuestion[] };

export default function StudyPanel({ character }: StudyPanelProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectTool(tool: StudyTool) {
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
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
    </div>
  );
}
