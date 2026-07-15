"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  function friendlyError(message: string): string {
    if (message.toLowerCase().includes("invalid login credentials")) {
      return t("login.errorInvalidCredentials");
    }
    if (message.toLowerCase().includes("email not confirmed")) {
      return t("login.errorEmailNotConfirmed");
    }
    return message;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(friendlyError(signInError.message));
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-paper px-4 py-10">
      <h1 className="text-4xl">
        <Logo />
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border-2 border-line px-6 py-8"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink">{t("login.title")}</h2>
          <p className="text-base text-muted">{t("login.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-lg font-medium text-ink">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-lg font-medium text-ink">
            {t("auth.password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky"
          />
        </div>

        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="mt-2 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:opacity-100"
        >
          {isLoading ? t("login.submitting") : t("login.submit")}
        </button>

        <p className="text-center text-base text-muted">
          {t("login.noAccount")}{" "}
          <Link
            href="/signup"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink/70"
          >
            {t("login.signUpLink")}
          </Link>
        </p>
      </form>
    </main>
  );
}
