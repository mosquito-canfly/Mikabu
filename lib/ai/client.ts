import { GoogleGenAI } from "@google/genai";
import type { StudyFile } from "@/lib/types";

// This file is the ONLY place allowed to import the provider SDK. Feature
// code must call generateChatReply() below instead of touching @google/genai
// directly, so the backend can be swapped (e.g. to Anthropic) later.

const MODEL = "gemini-flash-latest";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI backend is not configured.");
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateChatReplyParams {
  systemPrompt: string;
  messages: ChatMessage[];
}

export async function generateChatReply({
  systemPrompt,
  messages,
}: GenerateChatReplyParams): Promise<string> {
  try {
    const ai = getClient();

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("empty response");
    }

    return text;
  } catch (error) {
    console.error("Gemini client error:", error);
    throw new Error("Failed to generate a reply from the AI backend.");
  }
}

export interface GenerateStudyResponseParams {
  prompt: string;
  files?: StudyFile[];
}

export async function generateStudyResponse({
  prompt,
  files,
}: GenerateStudyResponseParams): Promise<string> {
  try {
    const ai = getClient();

    const fileParts = (files ?? [])
      .filter((file) => typeof file.data === "string" && file.data.length > 0)
      .map((file) => ({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data as string,
        },
      }));

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }, ...fileParts] }],
    });

    const text = response.text;
    if (!text) {
      throw new Error("empty response");
    }

    return text;
  } catch (error) {
    console.error("Gemini client error:", error);
    throw new Error("Failed to generate a reply from the AI backend.");
  }
}
