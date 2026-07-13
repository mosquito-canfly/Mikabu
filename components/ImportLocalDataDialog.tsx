"use client";

import { useState } from "react";
import LoadingBar from "@/components/LoadingBar";
import {
  clearLocalData,
  dismissImportThisSession,
  importLocalDataForUser,
  markImportedForUser,
} from "@/lib/storage";
import type { ImportProgress, ImportResult } from "@/lib/storage";

interface ImportLocalDataDialogProps {
  userId: string;
  characterCount: number;
  onDismiss: () => void;
  onImported: () => void;
}

type Phase = "offer" | "importing" | "result";

export default function ImportLocalDataDialog({
  userId,
  characterCount,
  onDismiss,
  onImported,
}: ImportLocalDataDialogProps) {
  const [phase, setPhase] = useState<Phase>("offer");
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [localCleared, setLocalCleared] = useState(false);

  function handleNotNow() {
    dismissImportThisSession(userId);
    onDismiss();
  }

  async function handleImport() {
    setPhase("importing");
    setProgress(null);
    const outcome = await importLocalDataForUser((p) => setProgress(p));
    setResult(outcome);
    setPhase("result");
    if (outcome.success) {
      markImportedForUser(userId);
      onImported();
    }
  }

  function handleClearLocal() {
    if (!window.confirm("Clear the local copy on this device? This can't be undone.")) return;
    clearLocalData();
    setLocalCleared(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import your characters"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
    >
      <div className="w-full max-w-sm rounded-3xl border-2 border-line bg-paper p-6 shadow-lg">
        {phase === "offer" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-ink">Bring your characters with you?</h2>
            <p className="text-base text-ink">
              We found {characterCount} character{characterCount === 1 ? "" : "s"} saved on this
              device. Import them into your account so you can use them anywhere.
            </p>
            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleNotNow}
                className="rounded-full px-4 py-2.5 text-base font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {phase === "importing" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-ink">Importing...</h2>
            <LoadingBar active accent="sky" />
            <p className="text-sm text-muted">
              {progress
                ? `${progress.completed} / ${progress.total} — ${progress.label}`
                : "Getting started..."}
            </p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="flex flex-col gap-4">
            {result.success ? (
              <>
                <h2 className="text-2xl font-bold text-ink">All set!</h2>
                <p className="text-base text-ink">
                  Imported {result.importedCharacters} character
                  {result.importedCharacters === 1 ? "" : "s"}, {result.importedChatSessions} chat
                  session{result.importedChatSessions === 1 ? "" : "s"}, and{" "}
                  {result.importedStudySessions} study session
                  {result.importedStudySessions === 1 ? "" : "s"}.
                </p>

                {localCleared ? (
                  <p className="text-sm text-muted">The local copy on this device has been cleared.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearLocal}
                    className="self-start rounded-full border-2 border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/40"
                  >
                    Clear local copy
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-2 self-end rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-ink">Some items didn&apos;t import</h2>
                <p className="text-base text-ink">
                  Your local data is untouched — nothing was lost. This didn&apos;t make it:
                </p>
                <ul className="max-h-32 list-disc overflow-y-auto rounded-2xl border-2 border-line bg-paper px-6 py-3 text-sm text-ink">
                  {result.failedItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="rounded-full px-4 py-2.5 text-base font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
                  >
                    Try again
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
