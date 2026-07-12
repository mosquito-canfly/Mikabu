"use client";

import type { StudyTool } from "@/lib/types";

interface StudyToolbarProps {
  onSelect: (tool: StudyTool) => void;
  disabled: boolean;
}

const TOOLS: { label: string; value: StudyTool }[] = [
  { label: "Explain", value: "explain" },
  { label: "Quiz", value: "quiz" },
  { label: "Summary", value: "summary" },
];

export default function StudyToolbar({ onSelect, disabled }: StudyToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(tool.value)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
