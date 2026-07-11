"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";

type CharacterFormData = Omit<Character, "id" | "createdAt">;

interface CharacterFormProps {
  onSubmit: (data: CharacterFormData) => void;
}

const initialFormData: CharacterFormData = {
  name: "",
  traits: "",
  hobbies: "",
  interests: "",
  speakingStyle: "",
};

export default function CharacterForm({ onSubmit }: CharacterFormProps) {
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);

  const isNameEmpty = formData.name.trim().length === 0;

  function handleChange<K extends keyof CharacterFormData>(
    field: K,
    value: CharacterFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isNameEmpty) return;
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="traits" className="text-sm font-medium">
          Traits
        </label>
        <textarea
          id="traits"
          rows={3}
          placeholder="Personality characteristics"
          value={formData.traits}
          onChange={(e) => handleChange("traits", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="hobbies" className="text-sm font-medium">
          Hobbies
        </label>
        <input
          id="hobbies"
          type="text"
          value={formData.hobbies}
          onChange={(e) => handleChange("hobbies", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="interests" className="text-sm font-medium">
          Interests
        </label>
        <input
          id="interests"
          type="text"
          value={formData.interests}
          onChange={(e) => handleChange("interests", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="speakingStyle" className="text-sm font-medium">
          Speaking Style
        </label>
        <textarea
          id="speakingStyle"
          rows={3}
          placeholder="Tone, catchphrases"
          value={formData.speakingStyle}
          onChange={(e) => handleChange("speakingStyle", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={isNameEmpty}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        Create Character
      </button>
    </form>
  );
}
