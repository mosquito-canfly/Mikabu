"use client";

interface NotesUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesUpload({ value, onChange }: NotesUploadProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="study-notes" className="text-lg font-semibold">
        Study Notes
      </label>
      <textarea
        id="study-notes"
        rows={12}
        placeholder="Paste your study notes here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  );
}
