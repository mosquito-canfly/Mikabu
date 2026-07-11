import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/ai/promptBuilder";
import { generateChatReply } from "@/lib/ai/client";
import type { Character, Message } from "@/lib/types";

// Reads process.env.GEMINI_API_KEY, so this route must run on the Node.js
// runtime rather than the edge runtime.
export const runtime = "nodejs";

interface ChatRequestBody {
  character?: Character;
  messages?: Message[];
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { character, messages } = body;

  if (!character || !messages) {
    return NextResponse.json(
      { error: "Both 'character' and 'messages' are required." },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = buildSystemPrompt(character);
    const chatMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const reply = await generateChatReply({
      systemPrompt,
      messages: chatMessages,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating a reply." },
      { status: 500 }
    );
  }
}
