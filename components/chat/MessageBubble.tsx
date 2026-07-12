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
        className={`max-w-[75%] break-words rounded-2xl px-4 py-2.5 text-base leading-relaxed ${
          isUser
            ? "whitespace-pre-wrap bg-ink text-paper"
            : "bg-star text-ink"
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
