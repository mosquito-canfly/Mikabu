"use client";

import { useState } from "react";
import LoadingBar from "@/components/LoadingBar";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
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
  const { t } = useTranslation();
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
    if (!window.confirm(t("import.clearLocalConfirm"))) return;
    clearLocalData();
    setLocalCleared(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("import.title")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
    >
      <div className="w-full max-w-sm rounded-3xl border-2 border-line bg-paper p-6 shadow-lg">
        {phase === "offer" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-ink">{t("import.title")}</h2>
            <p className="text-base text-ink">
              {t(characterCount === 1 ? "import.foundCountOne" : "import.foundCountOther", {
                count: characterCount,
              })}
            </p>
            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleNotNow}
                className="rounded-full px-4 py-2.5 text-base font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink"
              >
                {t("import.notNow")}
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
              >
                {t("import.import")}
              </button>
            </div>
          </div>
        )}

        {phase === "importing" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-ink">{t("import.importingTitle")}</h2>
            <LoadingBar active accent="sky" />
            <p className="text-sm text-muted">
              {progress
                ? t("import.progress", {
                    completed: progress.completed,
                    total: progress.total,
                    label: progress.label,
                  })
                : t("import.gettingStarted")}
            </p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="flex flex-col gap-4">
            {result.success ? (
              <>
                <h2 className="text-2xl font-bold text-ink">{t("import.allSetTitle")}</h2>
                <p className="text-base text-ink">
                  {t("import.importedSummary", {
                    characters: t(
                      result.importedCharacters === 1
                        ? "import.characterCountOne"
                        : "import.characterCountOther",
                      { count: result.importedCharacters }
                    ),
                    chats: t(
                      result.importedChatSessions === 1
                        ? "import.chatSessionCountOne"
                        : "import.chatSessionCountOther",
                      { count: result.importedChatSessions }
                    ),
                    studies: t(
                      result.importedStudySessions === 1
                        ? "import.studySessionCountOne"
                        : "import.studySessionCountOther",
                      { count: result.importedStudySessions }
                    ),
                  })}
                </p>

                {localCleared ? (
                  <p className="text-sm text-muted">{t("import.localCleared")}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearLocal}
                    className="self-start rounded-full border-2 border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/40"
                  >
                    {t("import.clearLocalCopy")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-2 self-end rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
                >
                  {t("import.done")}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-ink">{t("import.someItemsFailedTitle")}</h2>
                <p className="text-base text-ink">{t("import.untouchedNotice")}</p>
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
                    {t("import.close")}
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
                  >
                    {t("common.tryAgain")}
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
