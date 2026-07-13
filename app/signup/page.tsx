"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 6;

function friendlyError(message: string): string {
  if (message.toLowerCase().includes("already registered")) {
    return "That email is already in use.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Password must be at least 6 characters.";
  }
  return message;
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const isFormValid = email.trim().length > 0 && isPasswordValid;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(friendlyError(signUpError.message));
      setIsLoading(false);
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError("That email is already in use.");
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
          <h2 className="text-2xl font-bold text-ink">Sign up</h2>
          <p className="text-base text-muted">Create your Mikabu account.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-lg font-medium text-ink">
            Email
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
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky"
          />
          <p className="text-sm text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
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
          {isLoading ? "Signing up..." : "Sign up"}
        </button>

        <p className="text-center text-base text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink/70"
          >
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
