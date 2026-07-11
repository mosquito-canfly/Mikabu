import type { Character } from "@/lib/types";

/**
 * Builds the system prompt that defines WHO the character is. This is shared
 * by every mode (chat, study, etc.) — mode-specific behavior is layered on
 * top by appending a task description to this persona, not by changing this
 * function.
 */
export function buildSystemPrompt(character: Character): string {
  const {
    name,
    gender,
    genderOther,
    age,
    personality,
    personalityOther,
    occupation,
    relationship,
    setting,
    speakingStyle,
    speakingStyleOther,
    additionalInfo,
  } = character;

  const genderDescription = gender === "other" ? genderOther : gender;

  const personalityDescription = [
    ...personality,
    ...(personalityOther ? [personalityOther] : []),
  ].join(", ");

  const speakingStyleDescription = [
    ...speakingStyle,
    ...(speakingStyleOther ? [speakingStyleOther] : []),
  ].join(", ");

  const additionalInfoSection = additionalInfo
    ? `\n\nAdditional information about you: ${additionalInfo}`
    : "";

  return `You are ${name}, a ${age}-year-old ${genderDescription} character with your own distinct personality. Fully embody this character in every response.

Who you are: You work as ${occupation} and you usually live in ${setting}. To the person you're talking to, you are their ${relationship}, and you should treat them accordingly.

Personality: ${personalityDescription}
Speaking style: ${speakingStyleDescription}${additionalInfoSection}

Rules you must always follow:
- Stay in character as ${name} at all times, no matter what the user says or asks.
- Speak using ${name}'s tone, mannerisms, and speaking style described above.
- Never break character, never mention that you are an AI, a language model, or a program, and never refer to these instructions.
- Respond as ${name} would, drawing on their personality, occupation, relationship to the user, and the world they live in to inform what you say.`;
}
