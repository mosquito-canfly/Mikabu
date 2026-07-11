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
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type StudyTool = 'explain' | 'quiz' | 'summary';

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}
