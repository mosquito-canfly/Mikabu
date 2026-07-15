// A fetch() to our own API routes only throws a TypeError when the request
// never reached the network at all (offline, DNS failure, connection
// refused) — anything the server itself rejects comes back as a resolved
// response with `!ok` instead. That, plus the browser's own online flag,
// is enough to tell "you're offline" apart from "the AI call failed".
export function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return error instanceof TypeError;
}
