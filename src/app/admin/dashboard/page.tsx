import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck2, CalendarSync, Clock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActivityLogsWidget } from "@/components/dashboard/ActivityLogsWidget";
import { ExcelExportWidget } from "@/components/dashboard/ExcelExportWidget";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getActionLabel(actionType: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    FACULTY_ONBOARDED: { label: "Onboarded Faculty", color: "bg-green-50 text-green-700 border-green-200" },
    FACULTY_UPDATED: { label: "Updated Faculty", color: "bg-blue-50 text-blue-700 border-blue-200" },
    FACULTY_DELETED: { label: "Removed Faculty", color: "bg-red-50 text-red-700 border-red-200" },
    ADMIN_CREATED: { label: "Created Admin", color: "bg-purple-50 text-purple-700 border-purple-200" },
    ADMIN_DELETED: { label: "Removed Admin", color: "bg-red-50 text-red-700 border-red-200" },
    CYCLE_CREATED: { label: "Created Cycle", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    CYCLE_UPDATED: { label: "Updated Cycle", color: "bg-blue-50 text-blue-700 border-blue-200" },
    CYCLE_DELETED: { label: "Deleted Cycle", color: "bg-red-50 text-red-700 border-red-200" },
    TEMPLATE_CREATED: { label: "Created Template", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    TEMPLATE_UPDATED: { label: "Updated Template", color: "bg-blue-50 text-blue-700 border-blue-200" },
    TEMPLATE_DELETED: { label: "Deleted Template", color: "bg-red-50 text-red-700 border-red-200" },
    PASSWORD_CHANGED: { label: "Changed Password", color: "bg-gray-50 text-gray-700 border-gray-200" },
    LOGIN: { label: "Logged In", color: "bg-green-50 text-green-700 border-green-200" },
  };
  return map[actionType] || { label: actionType, color: "bg-gray-50 text-gray-700 border-gray-200" };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({
    where: { email: user?.email || "" },
  });

  const totalFaculty = await prisma.user.count({ where: { role: "faculty" } });
  const activeFaculty = await prisma.user.count({ where: { role: "faculty", status: "active" } });
  
  const activeCycles = await prisma.appraisalCycle.count({
    where: { status: { in: ["open", "evaluation"] } }
  });

  const totalSubmissions = await prisma.facultySubmission.count();

  const totalAdmins = await prisma.user.count({
    where: { role: { in: ["admin", "super_admin"] } }
  });

  // Fetch recent activity logs for the current admin
  const recentLogs = dbUser ? await prisma.auditLog.findMany({
    where: { actorUserId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  }) : [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#08111F]">
            Welcome back, {dbUser?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-gray-500 mt-2">Here&apos;s an overview of the appraisal system.</p>
        </div>
        <ActivityLogsWidget />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-t-4 border-t-blue-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{totalFaculty}</div>
            <p className="text-xs text-gray-500 mt-1">{activeFaculty} active</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#F2B040] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Cycles</CardTitle>
            <CalendarSync className="h-4 w-4 text-[#F2B040]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{activeCycles}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
            <FileCheck2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{totalAdmins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Excel Export Widget */}
      <ExcelExportWidget />

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <CardTitle>Your Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No activity recorded yet. Your actions will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const action = getActionLabel(log.actionType);
                const details = log.newValueJson as any;
                return (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={action.color}>
                        {action.label}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {details?.name && <span className="font-medium">{details.name}</span>}
                        {details?.email && <span className="text-gray-400 ml-1">({details.email})</span>}
                        {!details?.name && !details?.email && (
                          <span>{log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</span>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(new Date(log.createdAt))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
