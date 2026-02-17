import React, { createContext, useContext } from "react";
import { trpc } from "../lib/trpc";

type UserRole = "INVESTOR" | "VISIONARY" | null;

interface RoleContextValue {
  role: UserRole;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  isLoading: true
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: userData, isLoading } = trpc.user.me.useQuery();
  
  return (
    <RoleContext.Provider value={{ role: userData?.role || null, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
