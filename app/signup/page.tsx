"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 2;
const PROFILE_INSERT_RETRY_DELAY_MS = 400;

const inputClasses =
  "rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky";
const labelClasses = "text-lg font-medium text-ink";
const fieldErrorClasses = "text-sm text-red-700";

function friendlyError(message: string): string {
  if (message.toLowerCase().includes("already registered")) {
    return "That email is already in use.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Password must be at least 6 characters.";
  }
  return message;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertProfile(
  supabase: ReturnType<typeof createClient>,
  id: string,
  username: string
) {
  const attempt = () => supabase.from("profiles").insert({ id, username });

  let { error } = await attempt();
  if (error) {
    // The session cookie set by signUp() can take a moment to propagate to the
    // next request; retry once before treating this as a real failure.
    await wait(PROFILE_INSERT_RETRY_DELAY_MS);
    ({ error } = await attempt());
  }
  return error;
}

export default function SignupPage() {
  const router = useRouter();
  const { refreshUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const trimmedUsername = username.trim();
  const isUsernameValid = trimmedUsername.length >= MIN_USERNAME_LENGTH;
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const doPasswordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const isFormValid =
    isUsernameValid && email.trim().length > 0 && isPasswordValid && doPasswordsMatch;

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

    if (data.user) {
      const profileError = await insertProfile(supabase, data.user.id, trimmedUsername);

      if (profileError) {
        setError(
          "Your account was created, but we couldn't save your username. You're signed in — you can continue and set it later."
        );
        setAccountCreated(true);
        setIsLoading(false);
        return;
      }

      await refreshUsername();
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
          <p className="text-base text-muted">Let&apos;s create your Mikabu account! (≧▽≦)</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className={labelClasses}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setUsernameTouched(true)}
            className={inputClasses}
          />
          {usernameTouched && !isUsernameValid && (
            <p className={fieldErrorClasses}>
              Username must be at least {MIN_USERNAME_LENGTH} characters.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClasses}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
          <p className="text-sm text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            className={inputClasses}
          />
          {confirmTouched && confirmPassword.length > 0 && !doPasswordsMatch && (
            <p className={fieldErrorClasses}>Passwords do not match.</p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-base text-red-700">
            {error}
          </div>
        )}

        {accountCreated ? (
          <Link
            href="/"
            className="mt-2 rounded-full bg-ink px-4 py-2.5 text-center text-base font-medium text-paper transition-opacity hover:opacity-90"
          >
            Continue to Mikabu
          </Link>
        ) : (
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="mt-2 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:opacity-100"
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
        )}

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
