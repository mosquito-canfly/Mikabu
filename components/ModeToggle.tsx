"use client";

export type Mode = "chat" | "study";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: { label: string; value: Mode }[] = [
  { label: "Chat", value: "chat" },
  { label: "Study", value: "study" },
];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-300 p-1 dark:border-zinc-700">
      {MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            mode === option.value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
