"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, PenTool, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data.templates);
    } catch (error: any) {
      toast.error("Error loading templates", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleClone = async (id: string) => {
    setCloningId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}/clone`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clone template");
      }
      toast.success("Template cloned successfully");
      fetchTemplates();
    } catch (error: any) {
      toast.error("Error cloning template", { description: error.message });
    } finally {
      setCloningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete template");
      }
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error: any) {
      toast.error("Error deleting template", { description: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage your faculty appraisal form templates and schemas.
          </p>
        </div>
        <Link href="/admin/templates/builder">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="h-4 w-4" />
            Create New Template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4 pt-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <PenTool className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">No templates found</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                You haven't created any form templates yet. Get started by creating your first template.
              </p>
            </div>
            <Link href="/admin/templates/builder">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Create Template</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => {
            const isLinkedToCycle = template.isActive && template.cycle;
            const linkedCycleName = isLinkedToCycle ? template.cycle.name : null;
            const canDelete = !isLinkedToCycle && template.id !== "system-default-template";

            return (
            <Card key={template.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl line-clamp-1 text-gray-800">{template.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                  {isLinkedToCycle ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 whitespace-nowrap shrink-0">
                      In use: {linkedCycleName}
                    </Badge>
                  ) : (
                    <Badge variant={template.isActive ? "default" : "secondary"} className={template.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}>
                      {template.isActive ? "Active" : "Draft"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Cycle:</span>
                    <span className="font-medium text-gray-900">{template.cycle?.name || "Unlinked"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Version:</span>
                    <span className="font-medium text-gray-900">v{template.version}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(template.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 gap-2 flex bg-gray-50/30">
                <Link href={`/admin/templates/builder/${template.id}`} className="flex-1">
                  <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                    Edit Builder
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => handleClone(template.id)} 
                  disabled={cloningId === template.id} 
                  className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  title="Clone Template"
                >
                  {cloningId === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </Button>
                {template.id === "system-default-template" ? (
                  <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-200 select-none" title="Protected System Default">
                    System
                  </Badge>
                ) : canDelete ? (
                  <Button 
                    variant="outline" 
                    onClick={() => handleDelete(template.id)} 
                    disabled={deletingId === template.id} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 p-2"
                    title="Delete Template"
                  >
                    {deletingId === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
