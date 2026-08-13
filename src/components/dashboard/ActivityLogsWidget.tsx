"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  newValueJson: any;
  reason: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
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
    SUBMISSION_FINALIZED: { label: "Submitted Appraisal", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  return map[actionType] || { label: actionType.replace(/_/g, " "), color: "bg-gray-50 text-gray-700 border-gray-200" };
}

export function ActivityLogsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/activity-logs?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error("Failed to load activity logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs(currentPage);
    }
  }, [isOpen, currentPage]);

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <div className="relative z-50" ref={widgetRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2 border-[#F3E7DE] hover:bg-gray-50 text-gray-700 bg-white shadow-sm"
      >
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Activity Logs</span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#F3E7DE] bg-white p-4 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Your Activity Logs</h3>
            </div>
            <button
              onClick={() => fetchLogs(currentPage)}
              disabled={isLoading}
              className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="my-4 min-h-[250px] max-h-[350px] overflow-y-auto pr-1 space-y-2.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs text-gray-400">Loading activity...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">No activity logged yet.</p>
                <p className="text-[10px] text-gray-400 max-w-[200px] mt-1">Actions you perform on the portal will appear here.</p>
              </div>
            ) : (
              logs.map((log) => {
                const action = getActionLabel(log.actionType);
                const details = log.newValueJson as any;
                return (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-50 bg-gray-50/40 p-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-semibold ${action.color}`}>
                        {action.label}
                      </Badge>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-normal">
                      {details?.name && <span className="font-semibold text-gray-700">{details.name}</span>}
                      {details?.email && <span className="text-gray-500 text-[10px] ml-1">({details.email})</span>}
                      {log.reason && <span className="italic text-gray-500 ml-1"> - {log.reason}</span>}
                      {!details?.name && !details?.email && !log.reason && (
                        <span className="text-gray-500 font-medium">
                          {log.entityType} action logged
                        </span>
                      )}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className="text-gray-500">
                Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
                <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoading}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages || isLoading}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
