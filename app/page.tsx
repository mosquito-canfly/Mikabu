"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CharacterCard from "@/components/character/CharacterCard";
import LoadingBar from "@/components/LoadingBar";
import ImportLocalDataDialog from "@/components/ImportLocalDataDialog";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
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
  const { t } = useTranslation();
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
        setError(t("home.loadError"));
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
      setError(t("home.deleteError"));
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
          <p className="mt-2 text-lg text-muted">{t("common.tagline")}</p>
        </div>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {authLoading && <LanguageSwitcher />}
          {!authLoading && (
            <>
              {user ? (
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                  <div className="flex min-w-0 items-center gap-3">
                    <LanguageSwitcher />
                    <span
                      className="min-w-0 max-w-[240px] truncate text-base text-muted"
                      title={displayName}
                    >
                      {t("home.greeting", { name: truncateName(displayName) })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 rounded-full border-2 border-line px-5 py-2.5 text-base font-medium text-ink transition-colors hover:bg-line/40"
                  >
                    {t("home.logOut")}
                  </button>
                </div>
              ) : (
                <>
                  <LanguageSwitcher />
                  <Link
                    href="/login"
                    className="w-full rounded-full border-2 border-ink bg-paper px-5 py-2.5 text-center text-base font-medium text-ink transition-colors hover:bg-line/40 sm:w-auto"
                  >
                    {t("home.logIn")}
                  </Link>
                </>
              )}
            </>
          )}
          {!charactersLoading && characters.length > 0 && (
            <Link
              href="/create"
              className="w-full shrink-0 rounded-full bg-ink px-5 py-2.5 text-center text-base font-medium text-paper transition-opacity hover:opacity-90 sm:w-auto"
            >
              {t("home.newCharacter")}
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
          <p className="text-base text-ink">{t("home.signInNotice")}</p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/login"
              className="rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/40"
            >
              {t("home.logIn")}
            </Link>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label={t("home.dismiss")}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {t("home.dismiss")}
            </button>
          </div>
        </div>
      )}

      {charactersLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className="w-full max-w-xs">
            <LoadingBar active accent="star" />
          </div>
          <p className="text-base text-muted">{t("home.loadingCharacters")}</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-line py-24 text-center">
          <p className="text-xl font-bold text-ink">{t("home.emptyStateTitle")}</p>
          <Link
            href="/create"
            className="rounded-full bg-ink px-5 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90"
          >
            {t("home.newCharacter")}
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
