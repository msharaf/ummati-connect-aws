import { create } from "zustand";

export type UserRole = "INVESTOR" | "VISIONARY";

export type AuthUser = {
  id: string;
  fullName: string;
  role: UserRole;
};

type AuthState = {
  user?: AuthUser;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: undefined })
}));

