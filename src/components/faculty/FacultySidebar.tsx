"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  LogOut,
  History,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const navItems = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/self-review", label: "Self Review", icon: FileText },
  { href: "/faculty/history", label: "Submission History", icon: History },
];

export function FacultySidebar() {
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    async function getUserEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    getUserEmail();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#F3E7DE] bg-white">
      <div className="flex h-16 items-center border-b border-[#F3E7DE] px-6">
        <Image
          src="/institute-logo.svg"
          alt="Institute logo"
          width={56}
          height={56}
          className="rounded-md"
          unoptimized
        />
        <span className="ml-3 font-semibold text-[#08111F]">Faculty Portal</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#FFF4E6] text-[#E3120B]"
                  : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-[#E3120B]" : "text-gray-400"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#F3E7DE] p-4 space-y-1">
        {email && (
          <div className="px-3 py-1.5 mb-2 rounded-md bg-[#FFFDF7] border border-[#F3E7DE] flex flex-col gap-0.5 max-w-full overflow-hidden">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Logged in as</span>
            <span className="text-xs text-[#08111F] font-medium truncate" title={email}>{email}</span>
          </div>
        )}
        <Link
          href="/faculty/help"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
        >
          <HelpCircle className="mr-3 h-5 w-5 text-gray-400" />
          Help & Support
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-red-50 hover:text-[#E3120B]"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
