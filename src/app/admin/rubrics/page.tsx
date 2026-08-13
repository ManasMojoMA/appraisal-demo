"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, PenTool, Copy, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchRubrics() {
    try {
      const res = await fetch("/api/admin/rubrics");
      if (!res.ok) throw new Error("Failed to fetch rubrics");
      const data = await res.json();
      setRubrics(data.rubrics);
    } catch (error: any) {
      toast.error("Error loading rubrics", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRubrics();
  }, []);

  const handleClone = async (id: string) => {
    setCloningId(id);
    try {
      const res = await fetch(`/api/admin/rubrics/${id}/clone`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clone rubric");
      }
      toast.success("Rubric cloned successfully");
      fetchRubrics();
    } catch (error: any) {
      toast.error("Error cloning rubric", { description: error.message });
    } finally {
      setCloningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this grading rubric?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/rubrics/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete rubric");
      }
      toast.success("Rubric deleted successfully");
      fetchRubrics();
    } catch (error: any) {
      toast.error("Error deleting rubric", { description: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grading Rubrics</h1>
          <p className="text-muted-foreground mt-1">
            Manage your evaluation criteria and scoring limits.
          </p>
        </div>
        <Link href="/admin/rubrics/builder">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="h-4 w-4" />
            Create New Rubric
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : rubrics.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4 pt-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <ListChecks className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">No rubrics found</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                You haven't created any grading rubrics yet.
              </p>
            </div>
            <Link href="/admin/rubrics/builder">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Create Rubric</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rubrics.map((rubric) => {
            const isLinkedToCycle = rubric.isActive && rubric.cycle && rubric.cycle.id !== "base-cycle";
            const linkedCycleName = isLinkedToCycle ? rubric.cycle.name : null;
            const canDelete = !isLinkedToCycle && rubric.id !== "system-default-rubric";

            return (
            <Card key={rubric.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl line-clamp-1 text-gray-800">{rubric.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      Max Marks: <span className="font-semibold text-gray-800">{rubric.configJson?.maxTotalMarks || 0}</span>
                    </CardDescription>
                  </div>
                  {isLinkedToCycle ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 whitespace-nowrap shrink-0">
                      In use: {linkedCycleName}
                    </Badge>
                  ) : (
                    <Badge variant={rubric.isActive ? "default" : "secondary"} className={rubric.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}>
                      {rubric.isActive ? "Active" : "Draft"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Cycle:</span>
                    <span className="font-medium text-gray-900">{rubric.cycle?.name || "Unlinked"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Version:</span>
                    <span className="font-medium text-gray-900">v{rubric.version}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(rubric.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 gap-2 flex bg-gray-50/30">
                <Link href={`/admin/rubrics/builder/${rubric.id}`} className="flex-1">
                  <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                    Edit Builder
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => handleClone(rubric.id)} 
                  disabled={cloningId === rubric.id} 
                  className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  title="Clone Rubric"
                >
                  {cloningId === rubric.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </Button>
                {rubric.id === "system-default-rubric" ? (
                  <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-200 select-none" title="Protected System Default">
                    System
                  </Badge>
                ) : canDelete ? (
                  <Button 
                    variant="outline" 
                    onClick={() => handleDelete(rubric.id)} 
                    disabled={deletingId === rubric.id} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 p-2"
                    title="Delete Rubric"
                  >
                    {deletingId === rubric.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    disabled
                    className="text-gray-300 border-gray-100 p-2 cursor-not-allowed"
                    title={`Cannot delete — linked to cycle "${linkedCycleName}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
