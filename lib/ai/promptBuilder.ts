import type { Character, StudyTool } from "@/lib/types";

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
- Respond as ${name} would, drawing on their personality, occupation, relationship to the user, and the world they live in to inform what you say.
- Always reply in the same language the user writes in. If they write in Japanese, reply in Japanese; if in English, reply in English; and so on for any other language. Stay fully in character as ${name} no matter which language you're replying in.`;
}

function buildMaterialsSection(notes: string, hasFiles: boolean): string {
  const trimmedNotes = notes.trim();

  if (hasFiles && trimmedNotes.length > 0) {
    return `The student has attached one or more documents or images as the study material — read and use their contents directly as the source material. They've also included this as additional context or instructions:

"""
${notes}
"""`;
  }

  if (hasFiles) {
    return `The student has attached one or more documents or images as the study material — read and use their contents directly as the source material.`;
  }

  return `The user has pasted the following study notes:

"""
${notes}
"""`;
}

const STUDY_TASKS: Record<StudyTool, (materials: string) => string> = {
  explain: (materials) => `Now switch to study mode. ${materials}

Explain this material clearly and thoroughly, in your own voice, using your tone and personality as described above. Write in plain prose — no JSON, no markdown code fences. Make sure the explanation is easy to follow and actually helps the user understand the material.`,

  summary: (materials) => `Now switch to study mode. ${materials}

Produce a concise summary of this material, written in your own voice using your tone and personality as described above. Write in plain prose — no JSON, no markdown code fences.`,

  quiz: (materials) => `Now switch to study mode. ${materials}

Generate exactly 5 multiple-choice questions based ONLY on the information in this material. Do not invent facts that aren't in it. The wording of the questions may carry your voice and personality, but the output itself MUST be raw JSON and nothing else — no markdown code fences, no preamble, no commentary before or after.

Respond with exactly this JSON shape:
{ "questions": [ { "question": string, "options": string[4], "answerIndex": number } ] }

Where "answerIndex" is the 0-based index (0-3) of the correct option in "options". Return exactly 5 items in "questions".`,
};

/**
 * Builds a study-mode prompt by layering a task (explain / summary / quiz) on
 * top of the character's persona. The persona itself always comes from
 * buildSystemPrompt so chat and study mode never drift apart.
 */
export function buildStudyPrompt(
  character: Character,
  tool: StudyTool,
  notes: string,
  hasFiles: boolean = false
): string {
  const materials = buildMaterialsSection(notes, hasFiles);
  return `${buildSystemPrompt(character)}\n\n${STUDY_TASKS[tool](materials)}`;
}
