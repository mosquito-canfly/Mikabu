import { createClient } from "../supabase/client";
import type { StudyFile } from "../types";

const BUCKET = "study-files";

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

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /quota|payload too large|exceeded the maximum/i.test(message);
}

// Uploads a file's in-memory base64 data to the user's private folder in the
// study-files bucket. Logged out (no user id) is a no-op that hands the file
// back unchanged, since there's nowhere to persist it.
export async function uploadStudyFile(sessionId: string, file: StudyFile): Promise<StudyFile> {
  const userId = await getCurrentUserId();
  if (!userId || !file.data) return file;

  const storagePath = `${userId}/${sessionId}/${file.id}-${file.name}`;
  const blob = base64ToBlob(file.data, file.mimeType);
  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(storagePath, blob, { contentType: file.mimeType, upsert: true });
  if (error) {
    console.error(`Failed to upload study file to ${storagePath}:`, error);
    throw error;
  }

  return { ...file, storagePath };
}

export async function downloadStudyFile(storagePath: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET).download(storagePath);
  if (error) {
    console.error(`Failed to download study file from ${storagePath}:`, error);
    throw error;
  }
  return blobToBase64(data);
}

export async function deleteStudyFile(storagePath: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await getSupabase().storage.from(BUCKET).remove([storagePath]);
  if (error) {
    console.error(`Failed to delete study file at ${storagePath}:`, error);
    throw error;
  }
}

// The bucket has no direct "delete by session" call, so we list everything
// under the session's folder and remove it in one batch.
export async function deleteStudyFilesForSession(sessionId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const prefix = `${userId}/${sessionId}`;
  const { data: entries, error: listError } = await getSupabase().storage.from(BUCKET).list(prefix);
  if (listError) {
    console.error(`Failed to list study files under ${prefix}:`, listError);
    throw listError;
  }
  if (!entries || entries.length === 0) return;

  const paths = entries.map((entry) => `${prefix}/${entry.name}`);
  const { error } = await getSupabase().storage.from(BUCKET).remove(paths);
  if (error) {
    console.error(`Failed to delete study files under ${prefix}:`, error);
    throw error;
  }
}
