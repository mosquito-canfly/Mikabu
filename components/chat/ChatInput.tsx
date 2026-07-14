"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <textarea
        rows={1}
        value={value}
        disabled={isLoading}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="max-h-40 flex-1 resize-none rounded-2xl border-2 border-line bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-star focus-visible:ring-2 focus-visible:ring-star disabled:cursor-not-allowed disabled:opacity-60"
      />
      {isLoading ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star"
        >
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={value.trim().length === 0}
          className="rounded-full bg-star px-5 py-2.5 text-base font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          Send
        </button>
      )}
    </div>
  );
}
