import type { Character } from "./types";

const CHARACTERS_KEY = "mikabu:characters";

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
}
