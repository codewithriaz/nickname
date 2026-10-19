import { create } from "zustand";
import type { MeDTO } from "@/types/dto";

type AuthState = {
  user: MeDTO | null;
  setUser: (user: MeDTO | null) => void;
};

/** Mirrors the `me` query for components outside the query tree (e.g. interceptors). */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
