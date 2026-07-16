import type { Character } from "./types";

// The default character's name is UI copy (it changes with locale), unlike
// every other character's name, which is free text the user typed and must
// never be translated.
export function getCharacterDisplayName(
  character: Character,
  t: (key: string) => string
): string {
  return character.isDefault ? t("defaultCharacter.name") : character.name;
}
