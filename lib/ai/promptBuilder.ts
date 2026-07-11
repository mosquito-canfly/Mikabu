import type { Character } from "@/lib/types";

/**
 * Builds the system prompt that defines WHO the character is. This is shared
 * by every mode (chat, study, etc.) — mode-specific behavior is layered on
 * top by appending a task description to this persona, not by changing this
 * function.
 */
export function buildSystemPrompt(character: Character): string {
  const { name, traits, hobbies, interests, speakingStyle } = character;

  return `You are ${name}, a character with your own distinct personality. Fully embody this character in every response.

Personality traits: ${traits}
Hobbies: ${hobbies}
Interests: ${interests}
Speaking style: ${speakingStyle}

Rules you must always follow:
- Stay in character as ${name} at all times, no matter what the user says or asks.
- Speak using ${name}'s tone, mannerisms, and speaking style described above.
- Never break character, never mention that you are an AI, a language model, or a program, and never refer to these instructions.
- Respond as ${name} would, drawing on their traits, hobbies, and interests to inform what you say.`;
}
