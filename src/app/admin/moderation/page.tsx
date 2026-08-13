"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function DeanModerationPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const resCycles = await fetch("/api/admin/cycles");
        const dataCycles = await resCycles.json();
        setCycles(dataCycles.cycles || []);
        
        await fetchEvaluations("all");
      } catch (error) {
        toast.error("Failed to initialize");
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchEvaluations = async (cycleId: string) => {
    setIsLoading(true);
    try {
      const url = cycleId !== "all" ? `/api/admin/moderation?cycleId=${cycleId}` : "/api/admin/moderation";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setEvaluations(data.evaluations || []);
      } else {
        toast.error(data.error || "Failed to fetch evaluations");
      }
    } catch (error) {
      toast.error("Error fetching evaluations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCycleChange = (val: string | null) => {
    const cycle = val || "all";
    setSelectedCycle(cycle);
    fetchEvaluations(cycle);
  };

  const exportToCSV = () => {
    if (evaluations.length === 0) {
      toast.error("No data to export");
      return;
    }

    const dataToExport = evaluations.map((ev) => ({
      "Faculty Name": ev.faculty.name,
      "Email": ev.faculty.email,
      "Department": ev.faculty.department,
      "Cycle": ev.cycle.name,
      "Academic Year": ev.cycle.academicYear,
      "Teaching Score": ev.teachingStudentFeedbackMarks || 0,
      "Academic Delivery Score": ev.academicDeliveryMarks || 0,
      "Innovation Score": ev.innovationMarks || 0,
      "Research Score": ev.researchMarks || 0,
      "Service Score": ev.serviceMarks || 0,
      "Penalty Marks": ev.penaltyMarks || 0,
      "Total Final Score": ev.finalScore || 0,
      "Evaluator Notes": ev.evaluatorNotes || "",
      "Status": ev.finalStatus,
      "Evaluated Date": ev.updatedAt ? format(new Date(ev.updatedAt), "yyyy-MM-dd") : "",
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `faculty_appraisal_report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dean Moderation & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Review finalized evaluations across all departments and generate consolidated export reports.
          </p>
        </div>
        
        <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading || evaluations.length === 0}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Finalized Evaluations</CardTitle>
            <div className="w-[250px]">
              <Select value={selectedCycle} onValueChange={handleCycleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {cycles.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No finalized evaluations found.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map(ev => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <div className="font-medium">{ev.faculty.name}</div>
                        <div className="text-xs text-slate-500">{ev.faculty.email}</div>
                      </TableCell>
                      <TableCell>{ev.faculty.department}</TableCell>
                      <TableCell>{ev.cycle.name}</TableCell>
                      <TableCell className="text-right font-bold text-indigo-700">{ev.finalScore}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {ev.finalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {format(new Date(ev.updatedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
