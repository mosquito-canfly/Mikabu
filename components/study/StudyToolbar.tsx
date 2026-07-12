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
          className="rounded-full bg-sky px-4 py-2 text-base font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
