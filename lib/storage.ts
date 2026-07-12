import type { Character, ChatSession, StudySession } from "./types";

const CHARACTERS_KEY = "mikabu:characters";
const SESSIONS_KEY = "mikabu:sessions";
const STUDY_SESSIONS_KEY = "mikabu:studySessions";
const STUDY_COUNTERS_KEY = "mikabu:studyCounters";

export function getCharacters(): Character[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CHARACTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Character[]) : [];
  } catch {
    return [];
  }
}

export function getCharacter(id: string): Character | undefined {
  return getCharacters().find((character) => character.id === id);
}

export function saveCharacter(character: Character): void {
  if (typeof window === "undefined") return;

  const characters = getCharacters();
  const index = characters.findIndex((c) => c.id === character.id);

  if (index === -1) {
    characters.push(character);
  } else {
    characters[index] = character;
  }

  window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
}

export function deleteCharacter(id: string): void {
  if (typeof window === "undefined") return;

  const characters = getCharacters().filter((c) => c.id !== id);
  window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));

  deleteSessionsForCharacter(id);
  deleteStudySessionsForCharacter(id);
  deleteStudyCounter(id);
}

export function getSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatSession[]) : [];
  } catch {
    return [];
  }
}

export function getSessionsForCharacter(characterId: string): ChatSession[] {
  return getSessions()
    .filter((session) => session.characterId === characterId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): ChatSession | undefined {
  return getSessions().find((session) => session.id === id);
}

export function saveSession(session: ChatSession): void {
  if (typeof window === "undefined") return;

  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);

  if (index === -1) {
    sessions.push(session);
  } else {
    sessions[index] = session;
  }

  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;

  const sessions = getSessions().filter((s) => s.id !== id);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSessionsForCharacter(characterId: string): void {
  if (typeof window === "undefined") return;

  const sessions = getSessions().filter((s) => s.characterId !== characterId);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getStudySessions(): StudySession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STUDY_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudySession[]) : [];
  } catch {
    return [];
  }
}

export function getStudySessionsForCharacter(characterId: string): StudySession[] {
  return getStudySessions()
    .filter((session) => session.characterId === characterId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getStudySession(id: string): StudySession | undefined {
  return getStudySessions().find((session) => session.id === id);
}

export function saveStudySession(session: StudySession): void {
  if (typeof window === "undefined") return;

  const sessions = getStudySessions();
  const index = sessions.findIndex((s) => s.id === session.id);

  if (index === -1) {
    sessions.push(session);
  } else {
    sessions[index] = session;
  }

  window.localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteStudySession(id: string): void {
  if (typeof window === "undefined") return;

  const sessions = getStudySessions().filter((s) => s.id !== id);
  window.localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteStudySessionsForCharacter(characterId: string): void {
  if (typeof window === "undefined") return;

  const sessions = getStudySessions().filter((s) => s.characterId !== characterId);
  window.localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
}

function getStudyCounters(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STUDY_COUNTERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function nextStudyNumber(characterId: string): number {
  if (typeof window === "undefined") return 1;

  const counters = getStudyCounters();
  const next = (counters[characterId] ?? 0) + 1;
  counters[characterId] = next;
  window.localStorage.setItem(STUDY_COUNTERS_KEY, JSON.stringify(counters));
  return next;
}

export function deleteStudyCounter(characterId: string): void {
  if (typeof window === "undefined") return;

  const counters = getStudyCounters();
  delete counters[characterId];
  window.localStorage.setItem(STUDY_COUNTERS_KEY, JSON.stringify(counters));
}
