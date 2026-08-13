"use client";

import { useState, useEffect } from "react";
import { Upload, UserPlus, Search, RefreshCw, Mail, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Papa from "papaparse";

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeCode: "",
    department: "",
  });

  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    employeeCode: "",
    department: "",
  });

  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [unassignTargetIds, setUnassignTargetIds] = useState<string[]>([]);
  const [unassignCycleId, setUnassignCycleId] = useState("");

  const [isManageSubmissionsOpen, setIsManageSubmissionsOpen] = useState(false);
  const [manageSubmissionsAction, setManageSubmissionsAction] = useState<"reopened" | "submitted">("reopened");
  const [manageSubmissionsCycleId, setManageSubmissionsCycleId] = useState("");
  const [manageSubmissionsTargetIds, setManageSubmissionsTargetIds] = useState<string[]>([]);

  const loadCycles = async () => {
    try {
      const res = await fetch("/api/admin/cycles");
      const data = await res.json();
      if (data.cycles) {
        setCycles(data.cycles);
        if (data.cycles.length > 0) {
          setSelectedCycleId(data.cycles[0].id);
          setUnassignCycleId(data.cycles[0].id);
          setManageSubmissionsCycleId(data.cycles[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load cycles:", error);
    }
  };

  const handleManageSubmissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageSubmissionsCycleId || manageSubmissionsTargetIds.length === 0) {
      toast.error("Please select a cycle and at least one faculty member.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/submissions/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: manageSubmissionsCycleId,
          facultyIds: manageSubmissionsTargetIds,
          status: manageSubmissionsAction
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Successfully ${manageSubmissionsAction === "reopened" ? "reopened" : "closed"} submissions.`);
        setIsManageSubmissionsOpen(false);
        setSelectedFacultyIds([]);
        setManageSubmissionsTargetIds([]);
        loadFaculty();
      } else {
        toast.error("Operation Failed", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error("Operation Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || assignTargetIds.length === 0) {
      toast.error("Please select a cycle and at least one faculty member.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/cycles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycleId,
          facultyIds: assignTargetIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Faculty successfully assigned to appraisal cycle");
        setIsAssignDialogOpen(false);
        setSelectedFacultyIds([]);
        setAssignTargetIds([]);
        loadFaculty();
      } else {
        toast.error("Assignment Failed", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unassignCycleId || unassignTargetIds.length === 0) {
      toast.error("Please select a cycle and at least one faculty member.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/cycles/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: unassignCycleId,
          facultyIds: unassignTargetIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Faculty successfully unassigned from appraisal cycle");
        setIsUnassignDialogOpen(false);
        setUnassignTargetIds([]);
        loadFaculty();
      } else {
        toast.error("Unassign Failed", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDeleteSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/faculty/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedFacultyIds }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully deleted ${data.count} faculty members.`);
        setIsBulkDeleteDialogOpen(false);
        setSelectedFacultyIds([]);
        loadFaculty();
      } else {
        toast.error("Bulk Delete Failed", { description: data.error || "Something went wrong." });
      }
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/faculty");
      const data = await res.json();
      if (data.faculty) {
        setFaculty(data.faculty);
      }
    } catch (error) {
      console.error("Failed to load faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
    loadCycles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [activeDropdown]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Faculty Onboarded", {
          description: `${formData.name} can now sign in with Google using ${formData.email}`,
        });
        setIsManualOpen(false);
        setFormData({ name: "", email: "", employeeCode: "", department: "" });
        loadFaculty();
      } else {
        toast.error("Error", {
          description: data.error || "Failed to onboard faculty",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/faculty/${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          employeeCode: editData.employeeCode,
          department: editData.department,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Faculty Updated");
        setIsEditOpen(false);
        loadFaculty();
      } else {
        toast.error("Failed to update", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this faculty member? They will no longer be able to access the portal.")) return;
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Faculty removed");
        loadFaculty();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Unexpected error occurred.");
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results: any) => {
        setSubmitting(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const row of results.data as any[]) {
          if (!row.email || !row.name) continue;
          
          try {
            const res = await fetch("/api/admin/faculty", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: row.name,
                email: row.email,
                employeeCode: row.employeeCode || "",
                department: row.department || "",
              }),
            });
            if (res.ok) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }
        }
        
        setSubmitting(false);
        setIsCsvOpen(false);
        loadFaculty();
        
        if (failCount > 0) {
          toast.error("CSV Import Complete", {
            description: `Imported ${successCount} faculty. Failed: ${failCount}.`,
          });
        } else {
          toast.success("CSV Import Complete", {
            description: `Successfully onboarded ${successCount} faculty members. They can now sign in with Google.`,
          });
        }
      },
    });
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Faculty Management</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Onboard faculty by adding their email. They sign in using Google Authentication — no passwords needed.
          </p>
        </div>
        <div className="flex gap-4">
          {selectedFacultyIds.length > 0 && (
            <div className="flex gap-2">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md"
                onClick={() => {
                  setAssignTargetIds(selectedFacultyIds);
                  setIsAssignDialogOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign {selectedFacultyIds.length} Selected
              </Button>
              <Button 
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                onClick={() => {
                  setManageSubmissionsTargetIds(selectedFacultyIds);
                  setIsManageSubmissionsOpen(true);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Manage Submissions ({selectedFacultyIds.length})
              </Button>
              <Button 
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                onClick={() => {
                  setUnassignTargetIds(selectedFacultyIds);
                  setIsUnassignDialogOpen(true);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Unassign {selectedFacultyIds.length} Selected
              </Button>
              <Button 
                variant="outline"
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedFacultyIds.length} Selected
              </Button>
            </div>
          )}

          <Button variant="outline" className="bg-white" onClick={() => setIsCsvOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>

          <Button className="bg-[#E3120B] hover:bg-[#C8100A]" onClick={() => setIsManualOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={isCsvOpen} onOpenChange={setIsCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Faculty via CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with faculty details. They will be able to sign in with Google using the email provided.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <a 
              href="data:text/csv;charset=utf-8,name,email,employeeCode,department%0AJohn Doe,john@northbridge.demo,EMP001,Computer Science%0AJane Smith,jane@northbridge.demo,EMP002,Mathematics" 
              download="faculty_import_template.csv"
              className="text-sm text-blue-600 hover:underline"
            >
              ⬇ Download Sample CSV Template
            </a>
          </div>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              disabled={submitting}
            />
            {submitting && <p className="text-sm text-gray-500">Processing import... please wait.</p>}
            <p className="text-xs text-gray-400">
              CSV headers: name, email, employeeCode, department. No passwords needed — faculty use Google Sign-In.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>
              Add a faculty member&apos;s email to grant them access. They will sign in using their Google account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                required 
                placeholder="Dr. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Google / University Email *</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                placeholder="john@northbridge.demo"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                This must match the faculty member&apos;s Google account email exactly.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input 
                  id="employeeCode" 
                  placeholder="EMP001"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#E3120B] hover:bg-[#C8100A]" disabled={submitting}>
              {submitting ? "Adding..." : "Add Faculty"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty Details</DialogTitle>
            <DialogDescription>
              Update details for this faculty member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input 
                id="edit-name" 
                required 
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Google / University Email *</Label>
              <Input 
                id="edit-email" 
                type="email"
                required 
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                Changing this will require the faculty member to sign in with the new email.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-employeeCode">Employee Code</Label>
                <Input 
                  id="edit-employeeCode" 
                  value={editData.employeeCode}
                  onChange={(e) => setEditData({...editData, employeeCode: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input 
                  id="edit-department" 
                  value={editData.department}
                  onChange={(e) => setEditData({...editData, department: e.target.value})}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#E3120B] hover:bg-[#C8100A]" disabled={submitting}>
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Faculty Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Faculty to Appraisal Cycle</DialogTitle>
            <DialogDescription>
              Assign the selected faculty member(s) to a performance appraisal cycle. This will create self-review submission drafts for them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="assign-cycle">Appraisal Cycle *</Label>
              {cycles.length === 0 ? (
                <p className="text-sm text-red-500 font-medium">No appraisal cycles found. Please create one in Appraisal Cycles first.</p>
              ) : (
                <Select
                  value={selectedCycleId}
                  onValueChange={(val) => setSelectedCycleId(val || "")}
                >
                  <SelectTrigger className="w-full text-left whitespace-normal h-auto min-h-9 py-2">
                    <SelectValue placeholder="Select appraisal cycle">
                      {selectedCycleId ? (cycles.find((c: any) => c.id === selectedCycleId)?.name || selectedCycleId) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[250px] overflow-y-auto">
                    {cycles.map((c: any) => (
                      <SelectItem 
                        key={c.id} 
                        value={c.id}
                        className="[&>span]:whitespace-normal [&>span]:break-words py-2 w-full flex items-center pr-8 cursor-pointer"
                      >
                        {c.name} ({c.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="pt-2 text-xs text-gray-500">
              Selected faculty count: <span className="font-semibold text-gray-800">{assignTargetIds.length}</span>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              disabled={submitting || cycles.length === 0}
            >
              {submitting ? "Assigning..." : "Assign Faculty"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unassign Faculty Dialog */}
      <Dialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Appraisal Cycle</DialogTitle>
            <DialogDescription>
              Remove the selected faculty member(s) from a cycle. <strong className="text-red-500">Warning:</strong> Only Master Admins can unassign from a completed cycle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnassignSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="unassign-cycle">Appraisal Cycle *</Label>
              {cycles.length === 0 ? (
                <p className="text-sm text-red-500 font-medium">No appraisal cycles found.</p>
              ) : (
                <Select
                  value={unassignCycleId}
                  onValueChange={(val) => setUnassignCycleId(val || "")}
                >
                  <SelectTrigger className="w-full text-left whitespace-normal h-auto min-h-9 py-2">
                    <SelectValue placeholder="Select appraisal cycle">
                      {unassignCycleId ? (cycles.find((c: any) => c.id === unassignCycleId)?.name || unassignCycleId) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[250px] overflow-y-auto">
                    {cycles.map((c: any) => (
                      <SelectItem 
                        key={c.id} 
                        value={c.id}
                        className="[&>span]:whitespace-normal [&>span]:break-words py-2 w-full flex items-center pr-8 cursor-pointer"
                      >
                        {c.name} ({c.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="pt-2 text-xs text-gray-500">
              Selected faculty count: <span className="font-semibold text-gray-800">{unassignTargetIds.length}</span>
            </div>

            <Button 
              type="submit" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50" 
              variant="outline"
              disabled={submitting || cycles.length === 0}
            >
              {submitting ? "Unassigning..." : "Unassign Faculty"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-gray-900">{selectedFacultyIds.length}</span> faculty member(s)? This action <strong className="text-red-500">cannot be undone</strong> and will remove their data and associated submission entries.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleBulkDeleteSubmit}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete Selected"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Faculty Directory</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search faculty..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadFaculty} className="h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    checked={filteredFaculty.length > 0 && selectedFacultyIds.length === filteredFaculty.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFacultyIds(filteredFaculty.map(f => f.id));
                      } else {
                        setSelectedFacultyIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Emp Code</TableHead>
                <TableHead>Assigned Cycles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    Loading faculty directory...
                  </TableCell>
                </TableRow>
              ) : filteredFaculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No faculty members found. Click &quot;Add Faculty&quot; to onboard someone.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFaculty.map((f) => (
                  <TableRow key={f.id} className={selectedFacultyIds.includes(f.id) ? "bg-indigo-50/20" : ""}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        checked={selectedFacultyIds.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFacultyIds(prev => [...prev, f.id]);
                          } else {
                            setSelectedFacultyIds(prev => prev.filter(id => id !== f.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {f.email}
                      </div>
                    </TableCell>
                    <TableCell>{f.department || "-"}</TableCell>
                    <TableCell>{f.employeeCode || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {f.submissions && f.submissions.length > 0 ? (
                          f.submissions.map((sub: any) => (
                            <Badge 
                              key={sub.id} 
                              variant="secondary" 
                              className={`text-[10px] py-0.5 px-1.5 shadow-sm group flex items-center gap-1 pr-1 ${
                                sub.status === "reopened" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                sub.status === "submitted" || sub.status === "locked" ? "bg-green-50 text-green-700 border-green-200" :
                                "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                            >
                              {sub.cycle.name} {sub.status === "reopened" ? "(Reopened)" : sub.status === "submitted" || sub.status === "locked" ? "(Submitted)" : ""}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnassignTargetIds([f.id]);
                                  setUnassignCycleId(sub.cycleId);
                                  setIsUnassignDialogOpen(true);
                                }}
                                className="text-indigo-400 hover:text-red-500 hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        f.status === "active" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {f.status === "active" ? "Active" : "Pending First Login"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === f.id ? null : f.id);
                          }}
                          className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {activeDropdown === f.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                            <button
                              className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-indigo-600 font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignTargetIds([f.id]);
                                setIsAssignDialogOpen(true);
                                setActiveDropdown(null);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4 text-indigo-500" /> Assign to Cycle
                            </button>
                            <button
                              className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditData({
                                  id: f.id,
                                  name: f.name,
                                  email: f.email,
                                  employeeCode: f.employeeCode || "",
                                  department: f.department || "",
                                });
                                setIsEditOpen(true);
                                setActiveDropdown(null);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4 text-gray-500" /> Edit Details
                            </button>
                            <button
                              className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(f.id);
                                setActiveDropdown(null);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Submissions Dialog */}
      <Dialog open={isManageSubmissionsOpen} onOpenChange={setIsManageSubmissionsOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-gray-100 shadow-xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle>Manage Faculty Submissions</DialogTitle>
            <DialogDescription>
              Reopen a submitted appraisal so the faculty can edit it, or force close a resubmission.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManageSubmissionsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manage-action">Action *</Label>
              <div className="relative">
                <Select
                  required
                  value={manageSubmissionsAction}
                  onValueChange={(val: any) => setManageSubmissionsAction(val)}
                >
                  <SelectTrigger className="w-full bg-slate-50 border-gray-200" id="manage-action">
                    <SelectValue placeholder="Select Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reopened">Reopen Submissions (Allow Edits)</SelectItem>
                    <SelectItem value="submitted">Force Close Resubmissions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manage-cycle">Appraisal Cycle *</Label>
              <div className="relative">
                <Select
                  required
                  value={manageSubmissionsCycleId}
                  onValueChange={(val) => setManageSubmissionsCycleId(val || "")}
                >
                  <SelectTrigger className="w-full bg-slate-50 border-gray-200" id="manage-cycle">
                    <SelectValue 
                      placeholder="Select Cycle" 
                    >
                      {manageSubmissionsCycleId ? (cycles.find((c: any) => c.id === manageSubmissionsCycleId)?.name || manageSubmissionsCycleId) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mt-2">
              Selected faculty count: <span className="font-semibold text-gray-800">{manageSubmissionsTargetIds.length}</span>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsManageSubmissionsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#08111F] text-white hover:bg-[#0a1526]">
                {submitting ? "Processing..." : "Confirm Action"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
