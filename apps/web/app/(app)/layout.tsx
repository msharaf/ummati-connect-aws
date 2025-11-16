"use client";

import { RoleGuard } from "../../components/RoleGuard";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine required role based on path
  const getRequiredRole = (): "INVESTOR" | "VISIONARY" | undefined => {
    if (pathname.startsWith("/investor")) {
      return "INVESTOR";
    }
    if (pathname.startsWith("/visionary")) {
      return "VISIONARY";
    }
    // Admin routes don't require a role (handled by admin page itself)
    return undefined;
  };

  const requiredRole = getRequiredRole();

  return (
    <RoleGuard requiredRole={requiredRole}>
      {children}
    </RoleGuard>
  );
}

