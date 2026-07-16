import type { Character } from "./types";

export function createDefaultCharacter(): Character {
  return {
    // characters.id is a Postgres uuid column — must be a real UUID like every
    // other character, never a fixed string. Recreations get a fresh id; the
    // isDefault flag (not the id) is what makes it recognizable as "the" default.
    id: crypto.randomUUID(),
    name: "Mikabu (default)",
    gender: "other",
    genderOther: "a friendly companion",
    age: 16,
    personality: ["Cute", "Smart", "Gentle", "Caring", "Funny"],
    occupation: "a cheerful companion who helps new users get started",
    relationship: "your friendly guide",
    setting: "a cozy, welcoming corner of the app made just for you",
    speakingStyle: ["Casual", "Cute"],
    isDefault: true,
    createdAt: Date.now(),
  };
}

export function hasDefaultCharacter(characters: Character[]): boolean {
  return characters.some((c) => c.isDefault === true);
}
