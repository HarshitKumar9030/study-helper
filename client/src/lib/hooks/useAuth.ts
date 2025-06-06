"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-Side Authentication Check Hook
 * 
 * This hook can be used in client components to protect routes
 * and redirect unauthenticated users to the sign-in page.
 * 
 * @param redirectTo - Path to redirect unauthenticated users to
 * @returns Session status and session data
 */
export function useAuth(redirectTo = "/auth/signin") {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [status, router, redirectTo]);

  return { session, status };
}
