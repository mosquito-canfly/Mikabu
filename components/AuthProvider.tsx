"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  username: string | null;
  isLoading: boolean;
  refreshUsername: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  username: null,
  isLoading: true,
  refreshUsername: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const fetchUsername = useCallback(async (userId: string) => {
    const { data } = await supabaseRef.current!
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    return data?.username ?? null;
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current!;
    let requestId = 0;

    async function applySession(session: Session | null) {
      const id = ++requestId;
      setIsLoading(true);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setUsername(null);
        setIsLoading(false);
        return;
      }

      const nextUsername = await fetchUsername(currentUser.id);

      if (id !== requestId) return;
      setUsername(nextUsername);
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [fetchUsername]);

  async function refreshUsername() {
    if (!userRef.current) return;
    const nextUsername = await fetchUsername(userRef.current.id);
    setUsername(nextUsername);
  }

  return (
    <AuthContext.Provider value={{ user, username, isLoading, refreshUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
