"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("faculty" | "admin" | "super_admin" | "evaluator")[];
  fallbackUrl?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackUrl = "/login",
}: RoleGuardProps) {
  // Since middleware protects all protected routes on the server side,
  // we can safely assume the user is authorized initially to avoid client-side
  // transition flashes and loading spinners.
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      // Fast local check for session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthorized(false);
        router.push(fallbackUrl);
        return;
      }

      // Background validation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthorized(false);
        router.push(fallbackUrl);
      }
    };

    checkAuth();
  }, [fallbackUrl, router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
