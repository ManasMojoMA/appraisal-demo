"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PostLoginPage() {
  const [status, setStatus] = useState("Verifying your account...");
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setStatus("Authentication failed. Redirecting to login...");
        setTimeout(() => router.push("/login?error=no_user"), 2000);
        return;
      }

      // Check if user is onboarded in our database
      const res = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, supabaseId: user.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.authorized) {
        setStatus("Your email is not registered on this portal. Please contact your administrator.");
        // Sign out since they're not authorized
        await supabase.auth.signOut();
        setTimeout(() => router.push("/login?error=not_onboarded"), 3000);
        return;
      }

      // Route based on role
      if (data.role === "admin" || data.role === "super_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/faculty/dashboard");
      }
    }

    checkAccess();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E3120B] mx-auto"></div>
        <p className="text-[#6B7280] text-sm">{status}</p>
      </div>
    </div>
  );
}
