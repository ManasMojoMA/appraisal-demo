"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, CalendarDays, Loader2, Play, CheckCircle2, PauseCircle, Pencil, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Cycle = {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  submissionDeadlineAt: string;
  status: string;
};

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editCycleId, setEditCycleId] = useState<string | null>(null);
  const isViewOnly = editCycleId ? (cycles.find(c => c.id === editCycleId)?.status === "closed") : false;
  
  const [formData, setFormData] = useState({
    name: "",
    academicYear: "2025-2026",
    startDate: "",
    endDate: "",
    deadlineTime: "23:59",
    template: "",
    rubric: "",
  });

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/admin/cycles");
      const data = await res.json();
      if (res.ok) {
        setCycles(data.cycles);
      } else {
        toast.error(data.error || "Failed to fetch cycles");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplatesAndRubrics = async () => {
    try {
      const [resTemplates, resRubrics] = await Promise.all([
        fetch("/api/admin/templates"),
        fetch("/api/admin/rubrics")
      ]);
      
      const dataTemplates = await resTemplates.json();
      const dataRubrics = await resRubrics.json();

      if (resTemplates.ok) {
        setTemplates(dataTemplates.templates || []);
        if (dataTemplates.templates && dataTemplates.templates.length > 0 && !formData.template) {
          setFormData((prev) => ({ ...prev, template: dataTemplates.templates[0].id }));
        }
      }
      
      if (resRubrics.ok) {
        setRubrics(dataRubrics.rubrics || []);
        if (dataRubrics.rubrics && dataRubrics.rubrics.length > 0 && !formData.rubric) {
          setFormData((prev) => ({ ...prev, rubric: dataRubrics.rubrics[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates or rubrics", error);
    }
  };

  useEffect(() => {
    fetchCycles();
    fetchTemplatesAndRubrics();
  }, []);

  const handleSubmitCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editCycleId ? `/api/admin/cycles/${editCycleId}` : "/api/admin/cycles";
      const method = editCycleId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          academicYear: formData.academicYear,
          startDate: formData.startDate,
          endDate: formData.endDate,
          submissionDeadlineAt: formData.endDate && formData.deadlineTime
            ? `${formData.endDate}T${formData.deadlineTime}:00+05:30`
            : formData.endDate,
          templateId: formData.template,
          rubricId: formData.rubric,
        }),
      });

      if (res.ok) {
        toast.success(editCycleId ? "Cycle updated successfully" : "Cycle created successfully");
        setIsDialogOpen(false);
        fetchCycles();
        setFormData({ name: "", academicYear: "2025-2026", startDate: "", endDate: "", deadlineTime: "23:59", template: templates[0]?.id || "", rubric: rubrics[0]?.id || "" });
        setEditCycleId(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save cycle");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (cycle: any) => {
    setEditCycleId(cycle.id);
    const associatedTemplateId = cycle.formTemplates?.find((t: any) => t.isActive)?.id || cycle.formTemplates?.[0]?.id || "";
    const associatedRubricId = rubrics.find((r: any) => r.cycleId === cycle.id)?.id || rubrics[0]?.id || ""; // Quick client side match since we fetched all rubrics
    
    const deadlineObj = new Date(cycle.submissionDeadlineAt || cycle.endDate);
    // Extract time in IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(deadlineObj.getTime() + istOffset);
    const hours = istDate.getUTCHours().toString().padStart(2, '0');
    const mins = istDate.getUTCMinutes().toString().padStart(2, '0');

    setFormData({
      name: cycle.name,
      academicYear: cycle.academicYear,
      startDate: new Date(cycle.startDate).toISOString().split("T")[0],
      endDate: new Date(cycle.endDate).toISOString().split("T")[0],
      deadlineTime: `${hours}:${mins}`,
      template: associatedTemplateId,
      rubric: associatedRubricId,
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: "draft" | "active" | "completed") => {
    try {
      const res = await fetch(`/api/admin/cycles/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        toast.success(`Cycle marked as ${status}`);
        fetchCycles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cycle?")) return;
    try {
      const res = await fetch(`/api/admin/cycles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Cycle deleted");
        fetchCycles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete cycle");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const getStatusBadge = (cycle: Cycle) => {
    const isPastDeadline = new Date() > new Date(cycle.submissionDeadlineAt || cycle.endDate);
    
    if (cycle.status === "open" && isPastDeadline) {
      return <Badge className="bg-slate-500 hover:bg-slate-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
    }
    
    switch (cycle.status) {
      case "open":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm"><Play className="w-3 h-3 mr-1" /> Active</Badge>;
      case "closed":
        return <Badge className="bg-slate-500 hover:bg-slate-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "draft":
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600"><PauseCircle className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400">
            Appraisal Cycles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage performance appraisal cycles, timelines, and templates.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={() => {
              setEditCycleId(null);
              setFormData({
                name: "",
                academicYear: "2025-2026",
                startDate: "",
                endDate: "",
                deadlineTime: "23:59",
                template: templates[0]?.id || "",
                rubric: rubrics[0]?.id || "",
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Cycle
          </Button>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{isViewOnly ? "View Appraisal Cycle" : editCycleId ? "Edit Appraisal Cycle" : "Create New Cycle"}</DialogTitle>
              <DialogDescription>
                {isViewOnly ? "View the details of this completed appraisal cycle." : editCycleId ? "Modify appraisal cycle details and linked template." : "Define a new appraisal cycle period and attach a template."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCycle} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Cycle Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Annual Appraisal 2024" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                  disabled={isViewOnly}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  placeholder="e.g. 2025-2026"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                  disabled={isViewOnly}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Submission Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required 
                    disabled={isViewOnly}
                  />
                  <p className="text-[11px] text-slate-500 leading-normal">
                    The start date from which faculty can fill and submit their review.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Submission End Date (Deadline)</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required 
                    disabled={isViewOnly}
                  />
                  <Label htmlFor="deadlineTime" className="text-xs text-slate-600">Deadline Time (IST)</Label>
                  <Input 
                    id="deadlineTime" 
                    type="time" 
                    value={formData.deadlineTime}
                    onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                    required 
                    disabled={isViewOnly}
                  />
                  <p className="text-[11px] text-slate-500 leading-normal">
                    The final deadline date & time (IST) for faculty self-review submission.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Form Template</Label>
                  <Select 
                    value={formData.template} 
                    onValueChange={(val) => setFormData({ ...formData, template: val || "" })}
                    disabled={isViewOnly}
                  >
                    <SelectTrigger className="w-full text-left [&>span]:whitespace-normal [&>span]:line-clamp-none h-auto min-h-9 py-2">
                      <SelectValue placeholder="Select template">
                        {formData.template ? (templates.find((t) => t.id === formData.template)?.title || formData.template) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[300px] max-w-[400px] max-h-[300px] overflow-y-auto">
                      {templates.map((t) => (
                        <SelectItem 
                          key={t.id} 
                          value={t.id} 
                          className="[&>span]:whitespace-normal [&>span]:break-words py-2 w-full flex items-center pr-8 cursor-pointer"
                        >
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubric">Grading Rubric</Label>
                  <Select 
                    value={formData.rubric} 
                    onValueChange={(val) => setFormData({ ...formData, rubric: val || "" })}
                    disabled={isViewOnly}
                  >
                    <SelectTrigger className="w-full text-left [&>span]:whitespace-normal [&>span]:line-clamp-none h-auto min-h-9 py-2">
                      <SelectValue placeholder="Select rubric">
                        {formData.rubric ? (rubrics.find((r) => r.id === formData.rubric)?.name || formData.rubric) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[300px] max-w-[400px] max-h-[300px] overflow-y-auto">
                      {rubrics.map((r) => (
                        <SelectItem 
                          key={r.id} 
                          value={r.id} 
                          className="[&>span]:whitespace-normal [&>span]:break-words py-2 w-full flex items-center pr-8 cursor-pointer"
                        >
                          {r.name} (Max: {r.configJson?.maxTotalMarks})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {isViewOnly ? "Close" : "Cancel"}
                </Button>
                {!isViewOnly && (
                  <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editCycleId ? "Save Changes" : "Create Cycle"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" /> All Cycles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No cycles found. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead>Cycle Name</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => {
                    const isPastDeadline = new Date() > new Date(cycle.submissionDeadlineAt || cycle.endDate);
                    const effectiveStatus = (cycle.status === "open" && isPastDeadline) ? "closed" : cycle.status;

                    return (
                    <TableRow key={cycle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-medium">
                        <div>{cycle.name}</div>
                        <div className="text-xs text-slate-500">{cycle.academicYear}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(cycle.startDate), "MMM d, yyyy")} - {format(new Date(cycle.endDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cycle)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {effectiveStatus !== "open" && effectiveStatus !== "closed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              onClick={() => handleStatusChange(cycle.id, "active")}
                            >
                              Activate
                            </Button>
                          )}
                          {effectiveStatus === "open" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-slate-600 hover:bg-slate-100"
                              onClick={() => handleStatusChange(cycle.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          {effectiveStatus === "closed" ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => handleEditClick(cycle)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(cycle.id)}
                                title="Delete Cycle"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => handleEditClick(cycle)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(cycle.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
