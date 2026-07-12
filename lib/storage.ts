import type { Character, ChatSession } from "./types";

const CHARACTERS_KEY = "mikabu:characters";
const SESSIONS_KEY = "mikabu:sessions";

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
  return getSessions().filter((session) => session.characterId === characterId);
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
