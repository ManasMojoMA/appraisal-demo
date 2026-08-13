"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, History, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategoryCard } from "@/components/faculty/CategoryCard";
import type { FacultySubmissionState, FacultyVisibleFormSchema } from "@/lib/form-builder-types";
import { toast } from "sonner";
import Link from "next/link";

export default function HistorySubmissionViewer() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const router = useRouter();

  const [schema, setSchema] = useState<FacultyVisibleFormSchema | null>(null);
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);
  
  const [submission, setSubmission] = useState<FacultySubmissionState>({
    enabledCategories: [],
    entriesByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/faculty/history/${submissionId}`);
        if (res.ok) {
          const data = await res.json();
          const sub = data.submission;
          
          setSubmissionData(sub);
          setCycleInfo(sub.cycle);
          setSchema(sub.formTemplate.schemaJson as FacultyVisibleFormSchema);

          // Reconstruct submission state
          const dbCategories = sub.entries.map((e: any) => e.categoryKey);
          const enabledCategories = [...new Set<string>(dbCategories)];

          const entriesByCategory: Record<string, any[]> = {};
          for (const entry of sub.entries) {
            if (!entriesByCategory[entry.categoryKey]) {
              entriesByCategory[entry.categoryKey] = [];
            }
            entriesByCategory[entry.categoryKey].push({
              entryId: entry.id,
              categoryKey: entry.categoryKey,
              values: entry.dataJson,
            });
          }

          setSubmission({ enabledCategories, entriesByCategory });
        } else {
          toast.error("Failed to load submission details.");
          router.push("/faculty/history");
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred loading the submission.");
        router.push("/faculty/history");
      } finally {
        setIsLoading(false);
      }
    }
    if (submissionId) {
      loadData();
    }
  }, [submissionId, router]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-md mb-4"></div>
        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200 mb-8"></div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl border border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!schema) {
    return <div className="p-8 text-[#E3120B]">Failed to load submission schema.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/faculty/history">
          <Button variant="ghost" className="w-fit text-gray-500 hover:text-gray-900 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#F3E7DE] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <History className="h-5 w-5 text-[#E3120B]" />
              <span className="font-semibold text-gray-600">{cycleInfo?.name} ({cycleInfo?.academicYear})</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
              {schema.formTitle}
            </h1>
            <p className="mt-2 text-[#6B7280]">Read-only view of your past submission.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="bg-gray-100 px-3 py-1.5 rounded-md flex items-center gap-2 border border-gray-200">
               <span className="text-sm text-gray-500">Status:</span>
               <span className="text-sm font-bold text-gray-900 capitalize">{submissionData?.status}</span>
             </div>
             {submissionData?.submittedAt && (
               <div className="text-sm text-gray-500 flex items-center gap-1.5">
                 <Clock className="h-3.5 w-3.5" />
                 Submitted: {new Date(submissionData.submittedAt).toLocaleDateString()}
               </div>
             )}
          </div>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <FileText className="h-4 w-4 stroke-blue-800" />
        <AlertTitle className="font-semibold text-blue-900">Historical Record</AlertTitle>
        <AlertDescription>
          This is a read-only historical record of your submission. You cannot make any edits to this form.
        </AlertDescription>
      </Alert>

      {/* Dynamic Categories */}
      <div className="space-y-8 pointer-events-none opacity-95">
        {schema.categories.map((category) => {
          // Only show categories that were actually enabled in this past submission
          if (!submission.enabledCategories.includes(category.key)) return null;

          return (
            <CategoryCard
              key={category.key}
              category={category}
              isEnabled={true}
              entries={submission.entriesByCategory[category.key] || []}
              validationIssues={[]}
              onToggle={() => {}}
              onEntriesChange={() => {}}
              disabled={true}
            />
          );
        })}
      </div>
    </div>
  );
}
