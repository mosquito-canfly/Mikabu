import { NextResponse } from "next/server";
import { buildStudyPrompt } from "@/lib/ai/promptBuilder";
import { generateStudyResponse } from "@/lib/ai/client";
import type { Character, QuizQuestion, StudyFile, StudyTool } from "@/lib/types";

// Reads process.env.GEMINI_API_KEY, so this route must run on the Node.js
// runtime rather than the edge runtime.
export const runtime = "nodejs";

// Base64 file attachments inflate the request body; cap it generously above
// what a few 10MB-per-file attachments would produce, but well below anything
// that would strain the route handler.
const MAX_REQUEST_BYTES = 40 * 1024 * 1024;

interface StudyRequestBody {
  character?: Character;
  tool?: StudyTool;
  notes?: string;
  files?: StudyFile[];
}

const STUDY_TOOLS: StudyTool[] = ["explain", "quiz", "summary"];

function isValidTool(tool: unknown): tool is StudyTool {
  return typeof tool === "string" && STUDY_TOOLS.includes(tool as StudyTool);
}

function isValidFile(value: unknown): value is StudyFile {
  if (typeof value !== "object" || value === null) return false;
  const file = value as Record<string, unknown>;

  return (
    typeof file.id === "string" &&
    typeof file.name === "string" &&
    typeof file.mimeType === "string" &&
    typeof file.size === "number" &&
    (file.data === undefined || typeof file.data === "string")
  );
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function isValidQuizQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null) return false;
  const question = value as Record<string, unknown>;

  return (
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.answerIndex === "number" &&
    Number.isInteger(question.answerIndex) &&
    question.answerIndex >= 0 &&
    question.answerIndex < question.options.length
  );
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Attachments are too large. Try fewer or smaller files." },
      { status: 400 }
    );
  }

  let body: StudyRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { character, tool, notes, files } = body;

  if (
    !character ||
    !isValidTool(tool) ||
    typeof notes !== "string" ||
    (files !== undefined && (!Array.isArray(files) || !files.every(isValidFile)))
  ) {
    return NextResponse.json(
      { error: "'character', 'tool', and 'notes' are required." },
      { status: 400 }
    );
  }

  const filesWithData = (files ?? []).filter(
    (file) => typeof file.data === "string" && file.data.length > 0
  );

  if (notes.trim().length === 0 && filesWithData.length === 0) {
    return NextResponse.json(
      { error: "Add some notes or attach a file first." },
      { status: 400 }
    );
  }

  try {
    const prompt = buildStudyPrompt(character, tool, notes, filesWithData.length > 0);
    const reply = await generateStudyResponse({ prompt, files: filesWithData });

    if (tool === "quiz") {
      const cleaned = stripCodeFences(reply);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (error) {
        console.error("Study API quiz parse error:", error);
        return NextResponse.json(
          { error: "Couldn't generate a quiz from those notes. Please try again." },
          { status: 500 }
        );
      }

      const questions = (parsed as { questions?: unknown } | null)?.questions;

      if (!Array.isArray(questions) || !questions.every(isValidQuizQuestion)) {
        console.error("Study API quiz validation error: malformed questions", parsed);
        return NextResponse.json(
          { error: "Couldn't generate a quiz from those notes. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ questions: questions as QuizQuestion[] });
    }

    return NextResponse.json({ text: reply });
  } catch (error) {
    console.error("Study API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating a response." },
      { status: 500 }
    );
  }
}
