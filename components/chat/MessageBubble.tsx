"use client";

import Markdown from "react-markdown";
import type { Message } from "@/lib/types";
import { markdownComponents } from "@/components/MarkdownContent";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "whitespace-pre-wrap bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <Markdown components={markdownComponents}>{message.content}</Markdown>
        )}
      </div>
    </div>
  );
}
