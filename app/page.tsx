"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import CharacterCard from "@/components/character/CharacterCard";
import LoadingBar from "@/components/LoadingBar";
import ImportLocalDataDialog from "@/components/ImportLocalDataDialog";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  deleteCharacter,
  getCharacters,
  getLocalDataSnapshot,
  hasDismissedImportThisSession,
  hasImportedForUser,
} from "@/lib/storage";
import type { Character } from "@/lib/types";

const BANNER_DISMISSED_KEY = "mikabu-signin-banner-dismissed";
const NAME_TRUNCATE_LENGTH = 24;

function truncateName(name: string): string {
  if (name.length <= NAME_TRUNCATE_LENGTH) return name;
  return `${name.slice(0, NAME_TRUNCATE_LENGTH)}…`;
}

export default function Home() {
  const router = useRouter();
  const { user, username, isLoading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [importOfferCount, setImportOfferCount] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setCharactersLoading(true);
    setError(null);

    getCharacters()
      .then((data) => {
        if (cancelled) return;
        setCharacters(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Couldn't load your characters. Please check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setCharactersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, reloadToken]);

  useEffect(() => {
    setBannerDismissed(sessionStorage.getItem(BANNER_DISMISSED_KEY) === "true");
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setImportOfferCount(null);
      return;
    }
    if (hasImportedForUser(user.id) || hasDismissedImportThisSession(user.id)) return;

    const localCharacterCount = getLocalDataSnapshot().characters.length;
    if (localCharacterCount > 0) {
      setImportOfferCount(localCharacterCount);
    }
  }, [authLoading, user?.id]);

  async function handleDelete(id: string) {
    const previous = characters;
    setCharacters((prev) => prev.filter((character) => character.id !== id));
    try {
      await deleteCharacter(id);
    } catch {
      setCharacters(previous);
      setError("Couldn't delete that character. Please check your connection and try again.");
    }
  }

  function dismissBanner() {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setBannerDismissed(true);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleImportDismiss() {
    setImportOfferCount(null);
  }

  function handleImported() {
    setReloadToken((n) => n + 1);
  }

  const showBanner = !authLoading && !user && !bannerDismissed;
  const emailPrefix = user?.email ? user.email.split("@")[0] : "";
  const displayName = username ?? emailPrefix;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-16">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl">
            <Logo />
          </h1>
          <p className="mt-2 text-lg text-muted">Your character, your story</p>
        </div>
        <div className="flex items-center gap-3">
          {!authLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span
                    className="min-w-0 max-w-[240px] truncate text-base text-muted"
                    title={displayName}
                  >
                    Hi {truncateName(displayName)}! (ﾉ≧∀≦)ﾉ
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 rounded-full border-2 border-line px-5 py-2.5 text-base font-medium text-ink transition-colors hover:bg-line/40"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
                >
                  Log in
                </Link>
              )}
            </>
          )}
          {!charactersLoading && characters.length > 0 && (
            <Link
              href="/create"
              className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
            >
              New Character
            </Link>
          )}
        </div>
      </header>

      {error && (
        <p className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
          {error}
        </p>
      )}

      {showBanner && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border-2 border-line bg-sky/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-ink">
            You&apos;re not signed in — your characters are saved on this device only. Sign in
            to keep them safe and use them anywhere.
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-sky px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {charactersLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className="w-full max-w-xs">
            <LoadingBar active accent="star" />
          </div>
          <p className="text-base text-muted">Loading your characters...</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-line py-24 text-center">
          <p className="text-xl font-bold text-ink">Create your own character now!</p>
          <Link
            href="/create"
            className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
          >
            New Character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character, index) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDelete}
              accent={index % 2 === 0 ? "sky" : "star"}
            />
          ))}
        </div>
      )}

      {importOfferCount !== null && user && (
        <ImportLocalDataDialog
          userId={user.id}
          characterCount={importOfferCount}
          onDismiss={handleImportDismiss}
          onImported={handleImported}
        />
      )}
    </main>
  );
}
