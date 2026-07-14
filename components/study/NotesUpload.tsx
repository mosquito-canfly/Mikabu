"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteStudyFile,
  downloadStudyFile,
  isQuotaError,
  STORAGE_QUOTA_MESSAGE,
  uploadStudyFile,
} from "@/lib/storage/files";
import type { StudyFile } from "@/lib/types";

type FilesUpdater = StudyFile[] | ((prev: StudyFile[]) => StudyFile[]);

interface NotesUploadProps {
  sessionId: string;
  notes: string;
  onNotesChange: (value: string) => void;
  files: StudyFile[];
  onFilesChange: (update: FilesUpdater) => void;
}

const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function NotesUpload({
  sessionId,
  notes,
  onNotesChange,
  files,
  onFilesChange,
}: NotesUploadProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the session an in-flight upload/download belongs to, so a late
  // completion (user switched sessions before it resolved) doesn't merge into
  // — and persist onto — a session it was never meant for.
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  function markPending(id: string) {
    setPendingIds((prev) => new Set(prev).add(id));
  }

  function clearPending(id: string) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Reopening a session hands us files with a storagePath but no in-memory
  // data yet — fetch their contents lazily so the panel isn't blocked on it.
  useEffect(() => {
    const toDownload = files.filter((file) => file.storagePath && !file.data && !pendingIds.has(file.id));
    if (toDownload.length === 0) return;

    const downloadSessionId = sessionId;
    toDownload.forEach((file) => {
      markPending(file.id);
      downloadStudyFile(file.storagePath!)
        .then((data) => {
          if (sessionIdRef.current !== downloadSessionId) {
            console.error(
              `Study file ${file.name} finished downloading after switching away from its session; discarding to avoid mixing sessions.`
            );
            return;
          }
          onFilesChange((prev) => prev.map((f) => (f.id === file.id ? { ...f, data } : f)));
        })
        .catch((err) => {
          console.error(`Failed to load study file ${file.name} from storage:`, err);
        })
        .finally(() => clearPending(file.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, onFilesChange]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setFileError(null);

    const accepted: StudyFile[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (unsupported file type)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (over 10MB)`);
        continue;
      }

      try {
        const data = await readFileAsBase64(file);
        accepted.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data,
        });
      } catch {
        rejected.push(`${file.name} (couldn't be read)`);
      }
    }

    if (accepted.length > 0) {
      onFilesChange((prev) => [...prev, ...accepted]);

      if (user) {
        const uploadSessionId = sessionId;
        accepted.forEach((file) => {
          markPending(file.id);
          uploadStudyFile(uploadSessionId, file)
            .then((uploaded) => {
              if (sessionIdRef.current !== uploadSessionId) {
                console.error(
                  `Study file ${file.name} finished uploading after switching away from its session; discarding to avoid mixing sessions.`
                );
                return;
              }
              onFilesChange((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, storagePath: uploaded.storagePath } : f))
              );
            })
            .catch((err) => {
              console.error(`Failed to upload study file ${file.name} to storage:`, err);
              setFileError(
                isQuotaError(err)
                  ? STORAGE_QUOTA_MESSAGE
                  : `Couldn't save ${file.name} to your account, but it'll still work for this session.`
              );
            })
            .finally(() => clearPending(file.id));
        });
      }
    }
    if (rejected.length > 0) {
      setFileError(`Couldn't attach: ${rejected.join(", ")}`);
    }
  }

  function handleRemove(id: string) {
    const target = files.find((file) => file.id === id);
    onFilesChange((prev) => prev.filter((file) => file.id !== id));
    if (target?.storagePath) {
      deleteStudyFile(target.storagePath).catch((err) => {
        console.error(`Failed to delete study file ${target.name}:`, err);
      });
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="study-notes" className="text-lg font-medium text-ink">
        Study Notes
      </label>
      <textarea
        id="study-notes"
        rows={12}
        placeholder="Paste your study notes here..."
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          isDragging ? "border-sky bg-sky/20" : "border-line bg-paper"
        }`}
      >
        <p className="text-sm text-ink">Drag files here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-sky px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        >
          Attach files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted">PDF or image, up to 10MB each</p>
      </div>

      {fileError && <p className="text-sm text-red-700">{fileError}</p>}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file) => {
            const isPending = pendingIds.has(file.id);
            const needsReattach = !isPending && !file.data && !file.storagePath;
            return (
              <li
                key={file.id}
                className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm ${
                  needsReattach || isPending ? "border-line bg-line/30 text-muted" : "border-sky bg-sky/20 text-ink"
                }`}
              >
                <span className="font-medium">{FILE_TYPE_LABELS[file.mimeType] ?? "FILE"}</span>
                <span className="max-w-[160px] truncate">{file.name}</span>
                {isPending && <span className="italic">{file.data ? "saving…" : "loading…"}</span>}
                {needsReattach && <span className="italic">needs re-attaching</span>}
                <button
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="rounded-full px-1 text-muted transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
