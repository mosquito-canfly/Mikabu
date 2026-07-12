"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import { getSessionsForCharacter, saveSession } from "@/lib/storage";
import type { Character, ChatSession, Message } from "@/lib/types";

interface ChatWindowProps {
  character: Character;
}

function createSession(characterId: string, title: string): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    characterId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function ChatWindow({ character }: ChatWindowProps) {
  const [session, setSession] = useState<ChatSession | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingSessions = getSessionsForCharacter(character.id);
    const mostRecent = existingSessions.reduce<ChatSession | undefined>(
      (latest, candidate) =>
        !latest || candidate.updatedAt > latest.updatedAt ? candidate : latest,
      undefined
    );

    setSession(mostRecent ?? createSession(character.id, character.name));
    setError(null);
  }, [character.id, character.name]);

  const messages = session?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend(text: string) {
    if (!session) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const sessionWithUserMessage: ChatSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: Date.now(),
    };

    setSession(sessionWithUserMessage);
    saveSession(sessionWithUserMessage);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          messages: sessionWithUserMessage.messages,
        }),
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data: { reply: string } = await response.json();

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

      setSession(sessionWithReply);
      saveSession(sessionWithReply);
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearChat() {
    if (!session || session.messages.length === 0) return;
    if (!window.confirm("Clear this chat? This cannot be undone.")) return;

    const clearedSession: ChatSession = {
      ...session,
      messages: [],
      updatedAt: Date.now(),
    };

    setSession(clearedSession);
    saveSession(clearedSession);
    setError(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Say hello to {character.name} to start the conversation.
            </p>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[75%] rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {character.name} is typing...
              </div>
            </div>
          )}

          {error && (
            <div className="flex w-full justify-start">
              <div className="max-w-[75%] rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <ChatInput onSend={handleSend} disabled={isLoading} />
        {messages.length > 0 && (
          <div className="flex justify-end px-3 pb-2">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isLoading}
              className="text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-100 dark:disabled:hover:text-zinc-400"
            >
              Clear chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
