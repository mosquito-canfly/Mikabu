"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import SessionSidebar from "@/components/SessionSidebar";
import LoadingBar from "@/components/LoadingBar";
import { deleteSession, getSessionsForCharacter, saveSession } from "@/lib/storage";
import type { Character, ChatSession, Message } from "@/lib/types";

interface ChatWindowProps {
  character: Character;
}

const NEW_CHAT_TITLE = "New chat";
const AUTO_TITLE_LENGTH = 40;

function createSession(characterId: string): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    characterId,
    title: NEW_CHAT_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function truncateTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= AUTO_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, AUTO_TITLE_LENGTH).trimEnd()}…`;
}

function isBlank(session: ChatSession): boolean {
  return session.messages.length === 0;
}

function isUntouched(session: ChatSession): boolean {
  return isBlank(session) && session.title === NEW_CHAT_TITLE;
}

export default function ChatWindow({ character }: ChatWindowProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const existingSessions = getSessionsForCharacter(character.id);
    const mostRecent = existingSessions[0];

    if (mostRecent && isUntouched(mostRecent)) {
      setSessions(existingSessions);
      setActiveSessionId(mostRecent.id);
    } else {
      const fresh = createSession(character.id);
      saveSession(fresh);
      setSessions([fresh, ...existingSessions]);
      setActiveSessionId(fresh.id);
    }

    setError(null);
  }, [character.id]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const isNewSessionDisabled = activeSession ? isUntouched(activeSession) : false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function updateSession(updated: ChatSession) {
    saveSession(updated);
    setSessions((current) => {
      const index = current.findIndex((s) => s.id === updated.id);
      if (index === -1) return [...current, updated];
      const next = [...current];
      next[index] = updated;
      return next;
    });
  }

  async function handleSend(text: string) {
    if (!activeSession) return;

    const isFirstMessage = activeSession.messages.length === 0;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const sessionWithUserMessage: ChatSession = {
      ...activeSession,
      title:
        isFirstMessage && activeSession.title === NEW_CHAT_TITLE
          ? truncateTitle(text)
          : activeSession.title,
      messages: [...activeSession.messages, userMessage],
      updatedAt: Date.now(),
    };

    updateSession(sessionWithUserMessage);
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          messages: sessionWithUserMessage.messages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data: { reply: string } = await response.json();

      if (controller.signal.aborted) return;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };

      const sessionWithReply: ChatSession = {
        ...sessionWithUserMessage,
        messages: [...sessionWithUserMessage.messages, assistantMessage],
        updatedAt: Date.now(),
      };

      updateSession(sessionWithReply);
    } catch (err) {
      if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      setError("Something went wrong, please try again.");
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
    if (activeSession && isUntouched(activeSession)) return;

    const fresh = createSession(character.id);
    saveSession(fresh);
    setSessions((current) => [fresh, ...current]);
    setActiveSessionId(fresh.id);
    setError(null);
  }

  function handleSelectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setError(null);
  }

  function handleRenameSession(sessionId: string, newTitle: string) {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    const renamed: ChatSession = { ...target, title: newTitle };
    saveSession(renamed);
    setSessions((current) => current.map((s) => (s.id === sessionId ? renamed : s)));
  }

  function handleDeleteSession(sessionId: string) {
    deleteSession(sessionId);
    const remaining = sessions.filter((s) => s.id !== sessionId);

    if (sessionId !== activeSessionId) {
      setSessions(remaining);
      return;
    }

    if (remaining.length > 0) {
      const mostRecent = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setSessions(remaining);
      setActiveSessionId(mostRecent.id);
    } else {
      const fresh = createSession(character.id);
      saveSession(fresh);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
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
            newLabel="New chat"
            emptyLabel="No chats yet."
            newDisabled={isNewSessionDisabled}
            accent="star"
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
            {sidebarOpen ? "Hide chats" : "Show chats"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            {messages.length === 0 && (
              <p className="text-center text-base text-muted">
                Say hello to {character.name} to start the conversation.
              </p>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="max-w-[75%] rounded-2xl bg-line/50 px-4 py-2.5 text-base text-muted">
                  {character.name} is typing...
                </div>
              </div>
            )}

            {error && (
              <div className="flex w-full justify-start">
                <div className="max-w-[75%] rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
                  {error}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          <LoadingBar active={isLoading} accent="star" />
          <ChatInput onSend={handleSend} onStop={handleStop} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
