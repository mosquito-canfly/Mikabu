import { createClient } from "./supabase/client";
import { deleteStudyFilesForSession } from "./storage/files";
import type { Character, ChatSession, StudySession } from "./types";

const CHARACTERS_KEY = "mikabu:characters";
const SESSIONS_KEY = "mikabu:sessions";
const STUDY_SESSIONS_KEY = "mikabu:studySessions";
const STUDY_COUNTERS_KEY = "mikabu:studyCounters";

const LOAD_FAILED_MESSAGE = "Couldn't load your data. Please check your connection and try again.";
const SAVE_FAILED_MESSAGE = "Couldn't save to your account. Please check your connection and try again.";
const DELETE_FAILED_MESSAGE = "Couldn't delete from your account. Please check your connection and try again.";

// The per-character study-session counter has no dedicated table, so in the
// database it rides along inside the character row's own `data` blob.
type CharacterWithCounter = Character & { studyCounter?: number };

function stripCounter({ studyCounter: _studyCounter, ...character }: CharacterWithCounter): Character {
  return character;
}

let supabaseSingleton: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseSingleton) {
    supabaseSingleton = createClient();
  }
  return supabaseSingleton;
}

async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  return session?.user.id ?? null;
}

function sortByUpdatedDesc<T extends { updatedAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

function sanitizeStudySession(session: StudySession): StudySession {
  return {
    ...session,
    files: (session.files ?? []).map(({ id, name, mimeType, size, storagePath }) => ({
      id,
      name,
      mimeType,
      size,
      ...(storagePath ? { storagePath } : {}),
    })),
  };
}

// Best-effort bucket cleanup — logged so failures are visible, but never
// blocks a session/character deletion the user is waiting on.
async function cleanupStudyFiles(sessionId: string): Promise<void> {
  try {
    await deleteStudyFilesForSession(sessionId);
  } catch (error) {
    console.error(`Failed to delete study files for session ${sessionId}:`, error);
  }
}

// ---------------------------------------------------------------------------
// localStorage backend (used while logged out) — behavior unchanged from v1.
// ---------------------------------------------------------------------------

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getCharactersLocal(): Character[] {
  const parsed = readLocal<Character[]>(CHARACTERS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveCharacterLocal(character: Character): void {
  const characters = getCharactersLocal();
  const index = characters.findIndex((c) => c.id === character.id);
  if (index === -1) characters.push(character);
  else characters[index] = character;
  writeLocal(CHARACTERS_KEY, characters);
}

function deleteCharacterLocal(id: string): void {
  const characters = getCharactersLocal().filter((c) => c.id !== id);
  writeLocal(CHARACTERS_KEY, characters);
  deleteSessionsForCharacterLocal(id);
  deleteStudySessionsForCharacterLocal(id);
  deleteStudyCounterLocal(id);
}

function getSessionsLocal(): ChatSession[] {
  const parsed = readLocal<ChatSession[]>(SESSIONS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveSessionLocal(session: ChatSession): void {
  const sessions = getSessionsLocal();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index === -1) sessions.push(session);
  else sessions[index] = session;
  writeLocal(SESSIONS_KEY, sessions);
}

function deleteSessionLocal(id: string): void {
  const sessions = getSessionsLocal().filter((s) => s.id !== id);
  writeLocal(SESSIONS_KEY, sessions);
}

function deleteSessionsForCharacterLocal(characterId: string): void {
  const sessions = getSessionsLocal().filter((s) => s.characterId !== characterId);
  writeLocal(SESSIONS_KEY, sessions);
}

function getStudySessionsLocal(): StudySession[] {
  const parsed = readLocal<StudySession[]>(STUDY_SESSIONS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveStudySessionLocal(session: StudySession): void {
  const sanitized = sanitizeStudySession(session);
  const sessions = getStudySessionsLocal();
  const index = sessions.findIndex((s) => s.id === sanitized.id);
  if (index === -1) sessions.push(sanitized);
  else sessions[index] = sanitized;

  try {
    writeLocal(STUDY_SESSIONS_KEY, sessions);
  } catch (error) {
    console.warn("Failed to save study session (localStorage may be full):", error);
  }
}

function deleteStudySessionLocal(id: string): void {
  const sessions = getStudySessionsLocal().filter((s) => s.id !== id);
  writeLocal(STUDY_SESSIONS_KEY, sessions);
}

function deleteStudySessionsForCharacterLocal(characterId: string): void {
  const sessions = getStudySessionsLocal().filter((s) => s.characterId !== characterId);
  writeLocal(STUDY_SESSIONS_KEY, sessions);
}

function getStudyCountersLocal(): Record<string, number> {
  const parsed = readLocal<Record<string, number>>(STUDY_COUNTERS_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function nextStudyNumberLocal(characterId: string): number {
  const counters = getStudyCountersLocal();
  const next = (counters[characterId] ?? 0) + 1;
  counters[characterId] = next;
  writeLocal(STUDY_COUNTERS_KEY, counters);
  return next;
}

function deleteStudyCounterLocal(characterId: string): void {
  const counters = getStudyCountersLocal();
  delete counters[characterId];
  writeLocal(STUDY_COUNTERS_KEY, counters);
}

// ---------------------------------------------------------------------------
// Supabase backend (used while logged in) — each row's `data` jsonb column
// holds the full typed object; id/user_id/character_id are plain columns
// used for filtering and RLS ownership.
// ---------------------------------------------------------------------------

interface DataRow<T> {
  data: T;
}

async function dbGetAllForUser<T>(table: string, userId: string): Promise<T[]> {
  const { data, error } = await getSupabase().from(table).select("data").eq("user_id", userId);
  if (error) throw new Error(LOAD_FAILED_MESSAGE);
  return ((data ?? []) as DataRow<T>[]).map((row) => row.data);
}

async function dbGetForCharacter<T>(table: string, userId: string, characterId: string): Promise<T[]> {
  const { data, error } = await getSupabase()
    .from(table)
    .select("data")
    .eq("user_id", userId)
    .eq("character_id", characterId);
  if (error) throw new Error(LOAD_FAILED_MESSAGE);
  return ((data ?? []) as DataRow<T>[]).map((row) => row.data);
}

async function dbGetOne<T>(table: string, userId: string, id: string): Promise<T | undefined> {
  const { data, error } = await getSupabase()
    .from(table)
    .select("data")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(LOAD_FAILED_MESSAGE);
  return (data as DataRow<T> | null)?.data;
}

async function dbUpsert(table: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase().from(table).upsert(row);
  if (error) throw new Error(SAVE_FAILED_MESSAGE);
}

async function dbDeleteOne(table: string, userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from(table).delete().eq("user_id", userId).eq("id", id);
  if (error) throw new Error(DELETE_FAILED_MESSAGE);
}

async function dbDeleteForCharacter(table: string, userId: string, characterId: string): Promise<void> {
  const { error } = await getSupabase()
    .from(table)
    .delete()
    .eq("user_id", userId)
    .eq("character_id", characterId);
  if (error) throw new Error(DELETE_FAILED_MESSAGE);
}

async function getCharactersDb(userId: string): Promise<Character[]> {
  const rows = await dbGetAllForUser<CharacterWithCounter>("characters", userId);
  return rows.map(stripCounter);
}

async function getCharacterDb(userId: string, id: string): Promise<Character | undefined> {
  const row = await dbGetOne<CharacterWithCounter>("characters", userId, id);
  return row ? stripCounter(row) : undefined;
}

async function saveCharacterDb(userId: string, character: Character): Promise<void> {
  const existing = await dbGetOne<CharacterWithCounter>("characters", userId, character.id);
  const payload: CharacterWithCounter =
    existing?.studyCounter !== undefined
      ? { ...character, studyCounter: existing.studyCounter }
      : character;
  await dbUpsert("characters", { id: character.id, user_id: userId, data: payload });
}

async function deleteCharacterDb(userId: string, id: string): Promise<void> {
  // ON DELETE CASCADE removes the character's chat_sessions and study_sessions
  // rows; the study counter lives inside this row's own data and goes with it.
  // Bucket files aren't covered by that cascade, so clean them up per session first.
  const studySessions = await getStudySessionsForCharacterDb(userId, id);
  await Promise.all(studySessions.map((session) => cleanupStudyFiles(session.id)));
  await dbDeleteOne("characters", userId, id);
}

async function getSessionsDb(userId: string): Promise<ChatSession[]> {
  return dbGetAllForUser<ChatSession>("chat_sessions", userId);
}

async function getSessionsForCharacterDb(userId: string, characterId: string): Promise<ChatSession[]> {
  return dbGetForCharacter<ChatSession>("chat_sessions", userId, characterId);
}

async function getSessionDb(userId: string, id: string): Promise<ChatSession | undefined> {
  return dbGetOne<ChatSession>("chat_sessions", userId, id);
}

async function saveSessionDb(userId: string, session: ChatSession): Promise<void> {
  await dbUpsert("chat_sessions", {
    id: session.id,
    user_id: userId,
    character_id: session.characterId,
    data: session,
  });
}

async function deleteSessionDb(userId: string, id: string): Promise<void> {
  await dbDeleteOne("chat_sessions", userId, id);
}

async function deleteSessionsForCharacterDb(userId: string, characterId: string): Promise<void> {
  await dbDeleteForCharacter("chat_sessions", userId, characterId);
}

async function getStudySessionsDb(userId: string): Promise<StudySession[]> {
  return dbGetAllForUser<StudySession>("study_sessions", userId);
}

async function getStudySessionsForCharacterDb(userId: string, characterId: string): Promise<StudySession[]> {
  return dbGetForCharacter<StudySession>("study_sessions", userId, characterId);
}

async function getStudySessionDb(userId: string, id: string): Promise<StudySession | undefined> {
  return dbGetOne<StudySession>("study_sessions", userId, id);
}

async function saveStudySessionDb(userId: string, session: StudySession): Promise<void> {
  const sanitized = sanitizeStudySession(session);
  await dbUpsert("study_sessions", {
    id: sanitized.id,
    user_id: userId,
    character_id: sanitized.characterId,
    data: sanitized,
  });
}

async function deleteStudySessionDb(userId: string, id: string): Promise<void> {
  await cleanupStudyFiles(id);
  await dbDeleteOne("study_sessions", userId, id);
}

async function deleteStudySessionsForCharacterDb(userId: string, characterId: string): Promise<void> {
  const studySessions = await getStudySessionsForCharacterDb(userId, characterId);
  await Promise.all(studySessions.map((session) => cleanupStudyFiles(session.id)));
  await dbDeleteForCharacter("study_sessions", userId, characterId);
}

async function nextStudyNumberDb(userId: string, characterId: string): Promise<number> {
  const existing = await dbGetOne<CharacterWithCounter>("characters", userId, characterId);
  if (!existing) throw new Error(LOAD_FAILED_MESSAGE);

  const next = (existing.studyCounter ?? 0) + 1;
  await dbUpsert("characters", {
    id: characterId,
    user_id: userId,
    data: { ...existing, studyCounter: next },
  });
  return next;
}

// ---------------------------------------------------------------------------
// Public API — the only surface feature code should touch. Each function
// checks the current Supabase session and routes to the matching backend.
// ---------------------------------------------------------------------------

export async function getCharacters(): Promise<Character[]> {
  const userId = await getCurrentUserId();
  return userId ? getCharactersDb(userId) : getCharactersLocal();
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const userId = await getCurrentUserId();
  return userId ? getCharacterDb(userId, id) : getCharactersLocal().find((c) => c.id === id);
}

export async function saveCharacter(character: Character): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await saveCharacterDb(userId, character);
  } else {
    saveCharacterLocal(character);
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await deleteCharacterDb(userId, id);
  } else {
    deleteCharacterLocal(id);
  }
}

export async function getSessions(): Promise<ChatSession[]> {
  const userId = await getCurrentUserId();
  return userId ? getSessionsDb(userId) : getSessionsLocal();
}

export async function getSessionsForCharacter(characterId: string): Promise<ChatSession[]> {
  const userId = await getCurrentUserId();
  const sessions = userId
    ? await getSessionsForCharacterDb(userId, characterId)
    : getSessionsLocal().filter((s) => s.characterId === characterId);
  return sortByUpdatedDesc(sessions);
}

export async function getSession(id: string): Promise<ChatSession | undefined> {
  const userId = await getCurrentUserId();
  return userId ? getSessionDb(userId, id) : getSessionsLocal().find((s) => s.id === id);
}

export async function saveSession(session: ChatSession): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await saveSessionDb(userId, session);
  } else {
    saveSessionLocal(session);
  }
}

export async function deleteSession(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await deleteSessionDb(userId, id);
  } else {
    deleteSessionLocal(id);
  }
}

export async function deleteSessionsForCharacter(characterId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await deleteSessionsForCharacterDb(userId, characterId);
  } else {
    deleteSessionsForCharacterLocal(characterId);
  }
}

export async function getStudySessions(): Promise<StudySession[]> {
  const userId = await getCurrentUserId();
  return userId ? getStudySessionsDb(userId) : getStudySessionsLocal();
}

export async function getStudySessionsForCharacter(characterId: string): Promise<StudySession[]> {
  const userId = await getCurrentUserId();
  const sessions = userId
    ? await getStudySessionsForCharacterDb(userId, characterId)
    : getStudySessionsLocal().filter((s) => s.characterId === characterId);
  return sortByUpdatedDesc(sessions);
}

export async function getStudySession(id: string): Promise<StudySession | undefined> {
  const userId = await getCurrentUserId();
  return userId ? getStudySessionDb(userId, id) : getStudySessionsLocal().find((s) => s.id === id);
}

export async function saveStudySession(session: StudySession): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await saveStudySessionDb(userId, session);
  } else {
    saveStudySessionLocal(session);
  }
}

export async function deleteStudySession(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await deleteStudySessionDb(userId, id);
  } else {
    deleteStudySessionLocal(id);
  }
}

export async function deleteStudySessionsForCharacter(characterId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await deleteStudySessionsForCharacterDb(userId, characterId);
  } else {
    deleteStudySessionsForCharacterLocal(characterId);
  }
}

export async function nextStudyNumber(characterId: string): Promise<number> {
  const userId = await getCurrentUserId();
  return userId ? nextStudyNumberDb(userId, characterId) : nextStudyNumberLocal(characterId);
}

// ---------------------------------------------------------------------------
// Local-to-account import (Step 15c) — one-time migration of the data a user
// built up while logged out into their account once they sign in.
// ---------------------------------------------------------------------------

export interface LocalDataSnapshot {
  characters: Character[];
  sessions: ChatSession[];
  studySessions: StudySession[];
  studyCounters: Record<string, number>;
}

export interface ImportProgress {
  completed: number;
  total: number;
  label: string;
}

export interface ImportResult {
  success: boolean;
  importedCharacters: number;
  importedChatSessions: number;
  importedStudySessions: number;
  failedItems: string[];
}

export function getLocalDataSnapshot(): LocalDataSnapshot {
  return {
    characters: getCharactersLocal(),
    sessions: getSessionsLocal(),
    studySessions: getStudySessionsLocal(),
    studyCounters: getStudyCountersLocal(),
  };
}

export async function importLocalDataForUser(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      importedCharacters: 0,
      importedChatSessions: 0,
      importedStudySessions: 0,
      failedItems: ["You need to be signed in to import."],
    };
  }

  const snapshot = getLocalDataSnapshot();
  const total = snapshot.characters.length + snapshot.sessions.length + snapshot.studySessions.length;
  let completed = 0;
  const failedItems: string[] = [];
  let importedCharacters = 0;
  let importedChatSessions = 0;
  let importedStudySessions = 0;

  function reportProgress(label: string) {
    completed += 1;
    onProgress?.({ completed, total, label });
  }

  for (const character of snapshot.characters) {
    try {
      const studyCounter = snapshot.studyCounters[character.id];
      const payload: CharacterWithCounter =
        studyCounter !== undefined ? { ...character, studyCounter } : character;
      await dbUpsert("characters", { id: character.id, user_id: userId, data: payload });
      importedCharacters += 1;
    } catch {
      failedItems.push(`Character "${character.name}"`);
    }
    reportProgress(character.name);
  }

  for (const session of snapshot.sessions) {
    try {
      await dbUpsert("chat_sessions", {
        id: session.id,
        user_id: userId,
        character_id: session.characterId,
        data: session,
      });
      importedChatSessions += 1;
    } catch {
      failedItems.push(`Chat "${session.title}"`);
    }
    reportProgress(session.title);
  }

  for (const session of snapshot.studySessions) {
    try {
      const sanitized = sanitizeStudySession(session);
      await dbUpsert("study_sessions", {
        id: sanitized.id,
        user_id: userId,
        character_id: sanitized.characterId,
        data: sanitized,
      });
      importedStudySessions += 1;
    } catch {
      failedItems.push(`Study session "${session.title}"`);
    }
    reportProgress(session.title);
  }

  return {
    success: failedItems.length === 0,
    importedCharacters,
    importedChatSessions,
    importedStudySessions,
    failedItems,
  };
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHARACTERS_KEY);
  window.localStorage.removeItem(SESSIONS_KEY);
  window.localStorage.removeItem(STUDY_SESSIONS_KEY);
  window.localStorage.removeItem(STUDY_COUNTERS_KEY);
}

const IMPORTED_FLAG_PREFIX = "mikabu:imported:";
const IMPORT_DISMISSED_PREFIX = "mikabu:importDismissed:";

export function hasImportedForUser(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(`${IMPORTED_FLAG_PREFIX}${userId}`) === "true";
}

export function markImportedForUser(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${IMPORTED_FLAG_PREFIX}${userId}`, "true");
}

export function hasDismissedImportThisSession(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`${IMPORT_DISMISSED_PREFIX}${userId}`) === "true";
}

export function dismissImportThisSession(userId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${IMPORT_DISMISSED_PREFIX}${userId}`, "true");
}
