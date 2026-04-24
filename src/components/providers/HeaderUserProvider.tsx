"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type HeaderUser = {
  fullName: string;
  email: string;
  role: string | null;
};

type HeaderUserContextValue = {
  user: HeaderUser;
  loading: boolean;
};

const DEFAULT_HEADER_USER: HeaderUser = {
  fullName: "Your name",
  email: "you@neooffice.com",
  role: null,
};

const HeaderUserContext = createContext<HeaderUserContextValue | null>(null);

function mapUser(authUser: User, profile: { full_name: string | null; email: string | null; role: string | null } | null): HeaderUser {
  return {
    fullName: (profile?.full_name ?? "").trim() || "Your name",
    email: profile?.email ?? authUser.email ?? "you@neooffice.com",
    role: profile?.role ?? null,
  };
}

export function HeaderUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<HeaderUser>(DEFAULT_HEADER_USER);
  const [loading, setLoading] = useState(true);

  const resolveUser = useCallback(async (sessionUser?: User | null) => {
    const authUser = sessionUser ?? (await supabase.auth.getUser()).data.user ?? null;

    if (!authUser?.id) {
      // Only clear role on true session loss/logout.
      setUser(DEFAULT_HEADER_USER);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", authUser.id)
      .maybeSingle<{
        full_name: string | null;
        email: string | null;
        role: string | null;
      }>();

    setUser(mapUser(authUser, profile ?? null));
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const runInitialLoad = async () => {
      try {
        await resolveUser();
      } catch {
        if (!active) return;
        // Keep previously resolved user data to avoid tab flicker.
        setLoading(false);
      }
    };

    void runInitialLoad();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(DEFAULT_HEADER_USER);
        setLoading(false);
        return;
      }

      // Preserve last known role while refreshing.
      setLoading(true);
      try {
        await resolveUser(session.user);
      } catch {
        if (!active) return;
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [resolveUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [loading, user],
  );

  return (
    <HeaderUserContext.Provider value={value}>
      {children}
    </HeaderUserContext.Provider>
  );
}

export function useHeaderUser() {
  const ctx = useContext(HeaderUserContext);
  if (!ctx) {
    throw new Error("useHeaderUser must be used within HeaderUserProvider");
  }
  return ctx;
}
