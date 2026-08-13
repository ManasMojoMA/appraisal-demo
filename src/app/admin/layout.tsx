import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { LayoutDashboard, Users, CalendarSync, FileCode2, LogOut, Shield, Settings, ListChecks, FileSpreadsheet, ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    redirect("/faculty/dashboard");
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Appraisal Cycles", href: "/admin/cycles", icon: CalendarSync },
    { name: "Form Templates", href: "/admin/templates", icon: FileCode2 },
    { name: "Grading Rubrics", href: "/admin/rubrics", icon: ListChecks },
    { name: "Student Feedback", href: "/admin/student-feedback", icon: FileSpreadsheet },
    { name: "Faculty Management", href: "/admin/faculty", icon: Users },
    { name: "Dean Moderation", href: "/admin/moderation", icon: ShieldCheck },
    { name: "Admin Management", href: "/admin/admins", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#FFFDF7]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#08111F] text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-[#F2B040]">
            Admin Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">Appraisal Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4">
            <p className="text-sm font-medium">{dbUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{dbUser.email}</p>
            <span className="inline-block px-2 py-0.5 mt-2 bg-blue-900/50 text-blue-300 text-xs rounded-full">
              {dbUser.role.toUpperCase()}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
