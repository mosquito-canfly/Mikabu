export type AIBackend = 'gemini' | 'anthropic';

export interface Character {
  id: string;
  name: string;
  traits: string;         // personality characteristics
  hobbies: string;
  interests: string;
  speakingStyle: string;  // tone, catchphrases
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
