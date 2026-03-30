"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
    window.location.href = "/login";
  },

  isLoggedIn: () => !!get().user,
}));

/** 앱 마운트 시 Supabase 세션 구독 */
export function initAuthListener() {
  const supabase = createClient();

  supabase.auth.getUser().then(({ data: { user } }) => {
    useAuthStore.getState().setUser(user);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      useAuthStore.getState().setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}
