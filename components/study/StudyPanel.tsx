"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import NotesUpload from "@/components/study/NotesUpload";
import StudyToolbar from "@/components/study/StudyToolbar";
import QuizView from "@/components/study/QuizView";
import SessionSidebar from "@/components/SessionSidebar";
import LoadingBar from "@/components/LoadingBar";
import { markdownComponents } from "@/components/MarkdownContent";
import {
  deleteStudySession,
  getStudySessionsForCharacter,
  nextStudyNumber,
  saveStudySession,
} from "@/lib/storage";
import type {
  Character,
  QuizQuestion,
  StudyFile,
  StudyResult,
  StudySession,
  StudyTool,
} from "@/lib/types";

interface StudyPanelProps {
  character: Character;
}

const SAVE_DELAY = 500;

const TOOL_LABELS: Record<StudyTool, string> = {
  explain: "Explain",
  quiz: "Quiz",
  summary: "Summary",
};

function createStudySession(characterId: string, title: string): StudySession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    characterId,
    title,
    notes: "",
    files: [],
    results: [],
    createdAt: now,
    updatedAt: now,
  };
}

const NEW_STUDY_TITLE_PATTERN = /^New study \d+$/;

function isStudyBlank(session: StudySession, liveNotes?: string, liveFiles?: StudyFile[]): boolean {
  const notesToCheck = liveNotes ?? session.notes;
  const filesToCheck = liveFiles ?? session.files ?? [];
  return notesToCheck.trim().length === 0 && session.results.length === 0 && filesToCheck.length === 0;
}

function isStudyUntouched(session: StudySession, liveNotes?: string, liveFiles?: StudyFile[]): boolean {
  return isStudyBlank(session, liveNotes, liveFiles) && NEW_STUDY_TITLE_PATTERN.test(session.title);
}

export default function StudyPanel({ character }: StudyPanelProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const notesSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const existingSessions = getStudySessionsForCharacter(character.id);
    const mostRecent = existingSessions[0];

    if (mostRecent && isStudyUntouched(mostRecent)) {
      setSessions(existingSessions);
      setActiveSessionId(mostRecent.id);
      setNotes(mostRecent.notes);
      setFiles(mostRecent.files ?? []);
    } else {
      const fresh = createStudySession(character.id, `New study ${nextStudyNumber(character.id)}`);
      saveStudySession(fresh);
      setSessions([fresh, ...existingSessions]);
      setActiveSessionId(fresh.id);
      setNotes(fresh.notes);
      setFiles(fresh.files);
    }

    setError(null);
  }, [character.id]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const isNewSessionDisabled = activeSession ? isStudyUntouched(activeSession, notes, files) : false;
  const hasUsableContent = notes.trim().length > 0 || files.some((file) => Boolean(file.data));
  const hasAttachedFiles = files.some((file) => Boolean(file.data));

  function persistNotes(sessionId: string, text: string) {
    setSessions((current) => {
      const index = current.findIndex((s) => s.id === sessionId);
      if (index === -1 || current[index].notes === text) return current;

      const updated: StudySession = { ...current[index], notes: text, updatedAt: Date.now() };
      saveStudySession(updated);
      const next = [...current];
      next[index] = updated;
      return next;
    });
  }

  function persistFiles(sessionId: string, attachments: StudyFile[]) {
    setSessions((current) => {
      const index = current.findIndex((s) => s.id === sessionId);
      if (index === -1) return current;

      const updated: StudySession = { ...current[index], files: attachments, updatedAt: Date.now() };
      saveStudySession(updated);
      const next = [...current];
      next[index] = updated;
      return next;
    });
  }

  function flushPendingSaves() {
    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
      notesSaveTimeout.current = null;
    }
    if (filesSaveTimeout.current) {
      clearTimeout(filesSaveTimeout.current);
      filesSaveTimeout.current = null;
    }
    if (activeSessionId) {
      persistNotes(activeSessionId, notes);
      persistFiles(activeSessionId, files);
    }
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
    }
    const sessionId = activeSessionId;
    notesSaveTimeout.current = setTimeout(() => {
      notesSaveTimeout.current = null;
      persistNotes(sessionId, value);
    }, SAVE_DELAY);
  }

  function handleFilesChange(newFiles: StudyFile[]) {
    setFiles(newFiles);
    if (filesSaveTimeout.current) {
      clearTimeout(filesSaveTimeout.current);
    }
    const sessionId = activeSessionId;
    filesSaveTimeout.current = setTimeout(() => {
      filesSaveTimeout.current = null;
      persistFiles(sessionId, newFiles);
    }, SAVE_DELAY);
  }

  function appendResult(result: StudyResult) {
    setSessions((current) => {
      const index = current.findIndex((s) => s.id === activeSessionId);
      if (index === -1) return current;

      const updated: StudySession = {
        ...current[index],
        notes,
        files,
        results: [...current[index].results, result],
        updatedAt: Date.now(),
      };
      saveStudySession(updated);
      const next = [...current];
      next[index] = updated;
      return next;
    });
  }

  async function handleSelectTool(tool: StudyTool) {
    if (!activeSession) return;

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, tool, notes, files }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      if (tool === "quiz") {
        const data: { questions: QuizQuestion[] } = await response.json();
        if (controller.signal.aborted) return;
        appendResult({
          id: crypto.randomUUID(),
          tool,
          questions: data.questions,
          createdAt: Date.now(),
        });
      } else {
        const data: { text: string } = await response.json();
        if (controller.signal.aborted) return;
        appendResult({
          id: crypto.randomUUID(),
          tool,
          text: data.text,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  function handleNewSession() {
    if (activeSession && isStudyUntouched(activeSession, notes, files)) return;

    flushPendingSaves();
    const fresh = createStudySession(character.id, `New study ${nextStudyNumber(character.id)}`);
    saveStudySession(fresh);
    setSessions((current) => [fresh, ...current]);
    setActiveSessionId(fresh.id);
    setNotes(fresh.notes);
    setFiles(fresh.files);
    setError(null);
  }

  function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) return;
    flushPendingSaves();
    const target = sessions.find((s) => s.id === sessionId);
    setActiveSessionId(sessionId);
    setNotes(target?.notes ?? "");
    setFiles(target?.files ?? []);
    setError(null);
  }

  function handleRenameSession(sessionId: string, newTitle: string) {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    const renamed: StudySession = { ...target, title: newTitle };
    saveStudySession(renamed);
    setSessions((current) => current.map((s) => (s.id === sessionId ? renamed : s)));
  }

  function handleDeleteSession(sessionId: string) {
    deleteStudySession(sessionId);
    const remaining = sessions.filter((s) => s.id !== sessionId);

    if (sessionId !== activeSessionId) {
      setSessions(remaining);
      return;
    }

    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
      notesSaveTimeout.current = null;
    }
    if (filesSaveTimeout.current) {
      clearTimeout(filesSaveTimeout.current);
      filesSaveTimeout.current = null;
    }

    if (remaining.length > 0) {
      const mostRecent = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setSessions(remaining);
      setActiveSessionId(mostRecent.id);
      setNotes(mostRecent.notes);
      setFiles(mostRecent.files ?? []);
    } else {
      const fresh = createStudySession(character.id, `New study ${nextStudyNumber(character.id)}`);
      saveStudySession(fresh);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      setNotes(fresh.notes);
      setFiles(fresh.files);
    }

    setError(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-1">
      {sidebarOpen && (
        <div className="w-64 shrink-0">
          <SessionSidebar
            items={sortedSessions}
            activeId={activeSessionId}
            newLabel="New study"
            emptyLabel="No study sessions yet."
            newDisabled={isNewSessionDisabled}
            accent="sky"
            onSelect={handleSelectSession}
            onNew={handleNewSession}
            onRename={handleRenameSession}
            onDelete={handleDeleteSession}
          />
        </div>
      )}

      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex items-center border-b border-line px-3 py-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink"
          >
            {sidebarOpen ? "Hide sessions" : "Show sessions"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            <NotesUpload
              notes={notes}
              onNotesChange={handleNotesChange}
              files={files}
              onFilesChange={handleFilesChange}
            />
            <div className="flex flex-wrap items-center gap-2">
              <StudyToolbar onSelect={handleSelectTool} disabled={isLoading || !hasUsableContent} />
              {isLoading && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="rounded-full bg-ink px-4 py-2 text-base font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  Stop
                </button>
              )}
            </div>
            <LoadingBar active={isLoading} accent="sky" />

            {isLoading && (
              <p className="text-base text-muted">
                {character.name} is working on it
                {hasAttachedFiles ? " — reading your files may take a little longer" : ""}...
              </p>
            )}

            {error && (
              <p className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
                {error}
              </p>
            )}

            {activeSession?.results.map((result) => (
              <div key={result.id} className="flex flex-col gap-3 rounded-3xl border-2 border-line bg-sky/25 p-4">
                <span className="w-fit rounded-full bg-sky px-3 py-1 text-sm font-medium text-ink">
                  {TOOL_LABELS[result.tool]}
                </span>

                {result.tool === "quiz" ? (
                  <QuizView questions={result.questions ?? []} />
                ) : (
                  <div className="break-words text-base leading-relaxed text-ink">
                    <Markdown components={markdownComponents}>{result.text ?? ""}</Markdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
