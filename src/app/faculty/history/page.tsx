"use client";

import { useState, useEffect } from "react";
import { History, FileText, ChevronRight, CheckCircle2, Clock, CalendarDays, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/faculty/history");
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || []);
        } else {
          toast.error("Failed to load submission history.");
        }
      } catch (error) {
        console.error("Error loading history:", error);
        toast.error("An error occurred loading history.");
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
      case "locked":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Submitted</Badge>;
      case "evaluated":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Evaluated</Badge>;
      case "acknowledged":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged</Badge>;
      case "appealed":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><AlertCircle className="w-3 h-3 mr-1" /> Appealed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-md mb-4"></div>
        <div className="h-4 w-96 bg-gray-200 rounded-md mb-8"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl h-48 bg-white p-6">
              <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded-md mb-6"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-full mb-6"></div>
              <div className="h-10 w-full bg-gray-200 rounded-md mt-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <History className="h-8 w-8 text-[#E3120B]" />
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Submission History</h1>
      </div>
      <p className="mb-8 text-[#6B7280]">
        View your past performance appraisal submissions for completed cycles.
      </p>

      {submissions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-12 text-center bg-gray-50 flex flex-col items-center">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Past Submissions</h3>
          <p className="text-gray-500">
            You don't have any past submissions for closed appraisal cycles yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((sub) => (
            <Card key={sub.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col border-[#F3E7DE]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span className="font-bold text-[#08111F]">{sub.cycle.name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {sub.cycle.academicYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Final Status:</span>
                    {getStatusBadge(sub.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Submitted:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-[#F3E7DE] bg-gray-50/50 rounded-b-xl">
                <Link href={`/faculty/history/${sub.id}`} className="w-full">
                  <Button variant="outline" className="w-full justify-between group hover:border-[#E3120B] hover:text-[#E3120B] transition-colors">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View Submission
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
