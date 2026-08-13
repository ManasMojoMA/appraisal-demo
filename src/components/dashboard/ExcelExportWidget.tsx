"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Download, Loader2, FileSpreadsheet, CheckCircle2, FileEdit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { FacultyVisibleFormSchema } from "@/lib/form-builder-types";

interface Cycle {
  id: string;
  name: string;
  academicYear: string;
  status: string;
}

export function ExcelExportWidget() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [isLoadingCycles, setIsLoadingCycles] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<{
    totalAssigned: number;
    submittedCount: number;
    draftCount: number;
  } | null>(null);

  // Fetch all appraisal cycles
  useEffect(() => {
    async function loadCycles() {
      try {
        const res = await fetch("/api/admin/cycles");
        if (res.ok) {
          const data = await res.json();
          setCycles(data.cycles || []);
          if (data.cycles && data.cycles.length > 0) {
            setSelectedCycleId(data.cycles[0].id);
          }
        } else {
          toast.error("Failed to load appraisal cycles.");
        }
      } catch (err) {
        console.error("Error loading cycles:", err);
        toast.error("Failed to load appraisal cycles.");
      } finally {
        setIsLoadingCycles(false);
      }
    }
    loadCycles();
  }, []);

  // Fetch stats when cycle selection changes
  useEffect(() => {
    if (!selectedCycleId) return;

    async function loadStats() {
      try {
        const res = await fetch(`/api/admin/submissions/export?cycleId=${selectedCycleId}`);
        if (res.ok) {
          const data = await res.json();
          const subs = data.submissions || [];
          const totalAssigned = subs.length;
          const submittedCount = subs.filter((s: any) => s.status === "submitted" || s.status === "locked").length;
          const draftCount = totalAssigned - submittedCount;
          setStats({ totalAssigned, submittedCount, draftCount });
        }
      } catch (err) {
        console.error("Error loading stats for cycle:", err);
      }
    }
    loadStats();
  }, [selectedCycleId]);

  const handleExport = async () => {
    if (!selectedCycleId) {
      toast.error("Please select an appraisal cycle first.");
      return;
    }

    const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
    const cycleName = selectedCycle ? selectedCycle.name : "Appraisal";
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/submissions/export?cycleId=${selectedCycleId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch submission data");
      }

      const data = await res.json();
      const submissions = data.submissions || [];

      if (submissions.length === 0) {
        toast.info("No submissions found for the selected cycle.");
        setIsExporting(false);
        return;
      }

      // We need the form template schema to understand the categories and fields
      // Use the template from the first submission, or fall back to a default
      const firstSubmission = submissions[0];
      const schema = firstSubmission?.formTemplate?.schemaJson as FacultyVisibleFormSchema;

      if (!schema || !schema.categories) {
        toast.error("Template schema not found for this cycle.");
        setIsExporting(false);
        return;
      }

      // Create a new Excel workbook
      const wb = XLSX.utils.book_new();

      // --- Sheet 1: Summary Sheet ---
      const summaryRows = submissions.map((sub: any) => {
        const row: any = {
          "Employee Code": sub.faculty.employeeCode || "",
          "Faculty Name": sub.faculty.name || "",
          "Faculty Email": sub.faculty.email || "",
          "Department": sub.faculty.department || "",
          "Submission Status": sub.status.toUpperCase(),
          "Submission Date": sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "Not Submitted",
        };

        // For each category in the schema, add response summary columns
        schema.categories.forEach((cat) => {
          const catEntries = sub.entries.filter((entry: any) => entry.categoryKey === cat.key);
          
          if (catEntries.length === 0) {
            row[`${cat.label} - Responses`] = "No entries / Category not enabled";
            row[`${cat.label} - Evidence / Links`] = "";
          } else {
            // Flatten responses
            const responseTexts: string[] = [];
            const evidenceLinks: string[] = [];

            catEntries.forEach((entry: any, index: number) => {
              const entryVals = entry.dataJson || {};
              const fieldsSummary: string[] = [];

              cat.fields.forEach((field) => {
                const val = entryVals[field.key];
                if (val !== undefined && val !== null && field.type !== "evidence") {
                  if (Array.isArray(val)) {
                    const stringVals = val.map((item: any) => {
                      if (typeof item === 'object' && item !== null && item.option) {
                        return item.details ? `${item.option} (${item.details})` : item.option;
                      }
                      return String(item);
                    });
                    fieldsSummary.push(`${field.label}: [${stringVals.join(" | ")}]`);
                  } else {
                    fieldsSummary.push(`${field.label}: ${val}`);
                  }
                } else if (field.type === "evidence" && val) {
                  // Extract evidence links
                  if (val.type === "link" && val.linkUrl) {
                    evidenceLinks.push(val.linkUrl);
                  } else if (val.type === "upload" && val.uploadedFiles && Array.isArray(val.uploadedFiles)) {
                    val.uploadedFiles.forEach((file: any) => {
                      if (file.fileUrl) {
                        const fullUrl = file.fileUrl.startsWith("http") ? file.fileUrl : (origin + file.fileUrl);
                        evidenceLinks.push(fullUrl);
                      }
                    });
                  }
                }
              });

              responseTexts.push(`[Entry ${index + 1}] ${fieldsSummary.join(" | ")}`);
            });

            row[`${cat.label} - Responses`] = responseTexts.join("\n");
            row[`${cat.label} - Evidence / Links`] = evidenceLinks.join("\n");
          }
        });

        return row;
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      // --- Sheets 2+: Category Sheets ---
      schema.categories.forEach((cat) => {
        const catRows: any[] = [];

        submissions.forEach((sub: any) => {
          const catEntries = sub.entries.filter((entry: any) => entry.categoryKey === cat.key);

          catEntries.forEach((entry: any) => {
            const entryVals = entry.dataJson || {};
            const row: any = {
              "Employee Code": sub.faculty.employeeCode || "",
              "Faculty Name": sub.faculty.name || "",
              "Faculty Email": sub.faculty.email || "",
              "Department": sub.faculty.department || "",
              "Submission Status": sub.status.toUpperCase(),
            };

            // Add fields of the category
            cat.fields.forEach((field) => {
              const val = entryVals[field.key];
              if (field.type === "evidence") {
                let link1 = "";
                let link2 = "";
                let link3 = "";
                if (val) {
                  if (val.type === "link") {
                    link1 = val.linkUrl || "";
                  } else if (val.type === "upload" && val.uploadedFiles && Array.isArray(val.uploadedFiles)) {
                    if (val.uploadedFiles[0]?.fileUrl) {
                      link1 = val.uploadedFiles[0].fileUrl.startsWith("http") 
                        ? val.uploadedFiles[0].fileUrl 
                        : (origin + val.uploadedFiles[0].fileUrl);
                    }
                    if (val.uploadedFiles[1]?.fileUrl) {
                      link2 = val.uploadedFiles[1].fileUrl.startsWith("http") 
                        ? val.uploadedFiles[1].fileUrl 
                        : (origin + val.uploadedFiles[1].fileUrl);
                    }
                    if (val.uploadedFiles[2]?.fileUrl) {
                      link3 = val.uploadedFiles[2].fileUrl.startsWith("http") 
                        ? val.uploadedFiles[2].fileUrl 
                        : (origin + val.uploadedFiles[2].fileUrl);
                    }
                  }
                }
                row[`${field.label} - Link 1`] = link1;
                row[`${field.label} - Link 2`] = link2;
                row[`${field.label} - Link 3`] = link3;
              } else if (Array.isArray(val)) {
                const stringVals = val.map((item: any) => {
                  if (typeof item === 'object' && item !== null && item.option) {
                    return item.details ? `${item.option} (Details: ${item.details})` : item.option;
                  }
                  return String(item);
                });
                row[field.label] = stringVals.join(" | ");
              } else {
                row[field.label] = val !== undefined && val !== null ? val : "";
              }
            });

            catRows.push(row);
          });
        });

        // Only create a worksheet if there's at least one entry, or write headers if empty
        const emptyRow: any = {
          "Employee Code": "",
          "Faculty Name": "",
          "Faculty Email": "",
          "Department": "",
          "Submission Status": "",
        };
        cat.fields.forEach((field) => {
          if (field.type === "evidence") {
            emptyRow[`${field.label} - Link 1`] = "";
            emptyRow[`${field.label} - Link 2`] = "";
            emptyRow[`${field.label} - Link 3`] = "";
          } else {
            emptyRow[field.label] = "";
          }
        });
        const wsCat = catRows.length > 0 
          ? XLSX.utils.json_to_sheet(catRows) 
          : XLSX.utils.json_to_sheet([emptyRow]);

        // Sheet name limit is 31 characters in Excel and cannot contain certain chars
        const safeLabel = cat.label.replace(/[\\/*?:\[\]]/g, "_");
        const sheetName = safeLabel.substring(0, 30);
        XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
      });

      // Write and download the spreadsheet
      const safeCycleName = cycleName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      XLSX.writeFile(wb, `${safeCycleName}_appraisal_data.xlsx`);
      toast.success("Excel sheet exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingCycles) {
    return (
      <Card className="shadow-md">
        <CardContent className="flex items-center justify-center p-6 min-h-[150px]">
          <Loader2 className="h-6 w-6 animate-spin text-[#E3120B] mr-2" />
          <span className="text-sm font-medium text-gray-500">Loading appraisal cycles...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-[#F3E7DE]">
      <CardHeader className="pb-3 border-b border-[#F3E7DE]">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#E3120B]" />
          <div>
            <CardTitle className="text-lg font-bold text-[#08111F]">Export Appraisal Data</CardTitle>
            <CardDescription className="text-xs">
              Select an appraisal cycle to view submission progress and export the full data to a multi-sheet Excel file.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {cycles.length === 0 ? (
          <div className="flex items-center gap-2 p-4 border border-dashed rounded-lg bg-gray-50">
            <AlertCircle className="h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500">No appraisal cycles found. Create a cycle first to export data.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Select Appraisal Cycle</label>
                <Select value={selectedCycleId} onValueChange={(val) => setSelectedCycleId(val || "")}>
                  <SelectTrigger className="w-full bg-white border-[#F3E7DE] hover:border-gray-300">
                    <SelectValue placeholder="Select cycle">
                      {selectedCycleId ? (
                        (() => {
                          const c = cycles.find((cy) => cy.id === selectedCycleId);
                          return c ? `${c.name} (${c.academicYear})` : selectedCycleId;
                        })()
                      ) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-[250px]">
                    {cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-2 bg-[#FFFDF7] border border-[#F3E7DE] rounded-lg p-3">
                  <div className="flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-gray-400 font-medium">Assigned</span>
                    <span className="text-lg font-bold text-[#08111F]">{stats.totalAssigned}</span>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center border-x border-[#F3E7DE]">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3 inline" /> Submitted
                    </span>
                    <span className="text-lg font-bold text-green-700">{stats.submittedCount}</span>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                      <FileEdit className="h-3 w-3 inline" /> Draft
                    </span>
                    <span className="text-lg font-bold text-amber-700">{stats.draftCount}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedCycleId}
                className="w-full sm:w-auto bg-[#E3120B] hover:bg-[#C40E08] text-white gap-2 font-medium"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Excel...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Appraisal Data (.xlsx)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
