"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types/supabase";

interface AuthState {
  user: Profile | null;
  isAdmin: boolean;
  adminRole: string | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setAdmin: (isAdmin: boolean, role?: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      adminRole: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setAdmin: (isAdmin, role) => set({ isAdmin, adminRole: role || null }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, isAdmin: false, adminRole: null }),
    }),
    {
      name: "primemar-auth",
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin, adminRole: state.adminRole }),
    }
  )
);
