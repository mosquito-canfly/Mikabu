"use client";

interface NotesUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesUpload({ value, onChange }: NotesUploadProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="study-notes" className="text-lg font-medium text-ink">
        Study Notes
      </label>
      <textarea
        id="study-notes"
        rows={12}
        placeholder="Paste your study notes here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky"
      />
    </div>
  );
}
