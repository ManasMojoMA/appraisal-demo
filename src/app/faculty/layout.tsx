import { RoleGuard } from "@/components/auth/RoleGuard";
import { FacultySidebar } from "@/components/faculty/FacultySidebar";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["faculty"]}>
      <div className="flex h-screen bg-[#FFFDF7]">
        <FacultySidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
