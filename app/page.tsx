"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import CharacterCard from "@/components/character/CharacterCard";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { deleteCharacter, getCharacters } from "@/lib/storage";
import type { Character } from "@/lib/types";

const BANNER_DISMISSED_KEY = "mikabu-signin-banner-dismissed";
const EMAIL_TRUNCATE_LENGTH = 24;

function truncateEmail(email: string): string {
  if (email.length <= EMAIL_TRUNCATE_LENGTH) return email;
  return `${email.slice(0, EMAIL_TRUNCATE_LENGTH)}…`;
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    setCharacters(getCharacters());
  }, []);

  useEffect(() => {
    setBannerDismissed(sessionStorage.getItem(BANNER_DISMISSED_KEY) === "true");
  }, []);

  function handleDelete(id: string) {
    deleteCharacter(id);
    setCharacters((prev) => prev.filter((character) => character.id !== id));
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

  const showBanner = !authLoading && !user && !bannerDismissed;

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
                  <span className="text-base text-muted" title={user.email ?? ""}>
                    {truncateEmail(user.email ?? "")}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border-2 border-line px-5 py-2.5 text-base font-medium text-ink transition-colors hover:bg-line/40"
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
          {characters.length > 0 && (
            <Link
              href="/create"
              className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
            >
              New Character
            </Link>
          )}
        </div>
      </header>

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

      {characters.length === 0 ? (
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
    </main>
  );
}
