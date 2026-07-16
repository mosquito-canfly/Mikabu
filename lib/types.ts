export type AIBackend = 'gemini' | 'anthropic';

export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  genderOther?: string;       // filled only when gender === "other"
  age: number;
  personality: string[];      // selected traits
  personalityOther?: string;  // free text when "Other" is ticked
  occupation: string;
  relationship: string;       // "who is this character to you?"
  setting: string;            // "where does the character usually live?"
  speakingStyle: string[];    // selected styles
  speakingStyleOther?: string; // free text when "Other" is ticked
  additionalInfo?: string;    // optional; the only optional field
  createdAt: number;
  isDefault?: boolean;        // the built-in preset character seeded for new users
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  characterId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type StudyTool = 'explain' | 'quiz' | 'summary';

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface StudyResult {
  id: string;
  tool: StudyTool;              // "explain" | "quiz" | "summary"
  text?: string;                // for explain and summary
  questions?: QuizQuestion[];   // for quiz
  createdAt: number;
}

export interface StudyFile {
  id: string;
  name: string;
  mimeType: string;      // e.g. "application/pdf", "image/png"
  size: number;          // bytes
  data?: string;         // base64, NOT persisted — in-memory only
  storagePath?: string;  // set when persisted to Supabase Storage; absent when in-memory only
}

export interface StudySession {
  id: string;
  characterId: string;
  title: string;
  notes: string;
  files: StudyFile[];            // persisted WITHOUT the `data` field (metadata only)
  results: StudyResult[];       // every result generated in this session
  createdAt: number;
  updatedAt: number;
}
