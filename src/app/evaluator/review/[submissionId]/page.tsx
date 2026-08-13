import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { GradingForm } from "./GradingForm";

const renderValue = (val: any) => {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val === null || val === undefined || val === '') return '-';
  if (Array.isArray(val)) {
    return (
      <ul className="list-disc pl-4 space-y-1">
        {val.map((item, i) => (
          <li key={i}>
            {typeof item === 'object' && item.option ? (
              <span>
                <strong>{item.option}</strong>
                {item.details && <div className="text-gray-600 mt-1 pl-2 border-l-2 text-xs">{item.details}</div>}
              </span>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export default async function EvaluatorReviewPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const resolvedParams = await params;
  const submission = await prisma.facultySubmission.findUnique({
    where: { id: resolvedParams.submissionId },
    include: {
      faculty: true,
      cycle: {
        include: {
          rubricVersions: {
            where: { isActive: true },
            take: 1
          }
        }
      },
      entries: true,
      formTemplate: true,
      evaluation: true, // Fetch existing evaluation if any
    }
  });

  if (!submission) {
    notFound();
  }

  // Fetch student feedback for this cycle and faculty email
  const studentFeedback = await prisma.studentFeedbackRecord.findMany({
    where: {
      cycleId: submission.cycleId,
      facultyEmail: submission.faculty.email,
    },
    orderBy: { averageScore5: 'desc' }
  });

  // Quick reconstruction of entries for view
  const entriesByCategory: Record<string, any[]> = {};
  for (const entry of submission.entries) {
    if (!entriesByCategory[entry.categoryKey]) {
      entriesByCategory[entry.categoryKey] = [];
    }
    entriesByCategory[entry.categoryKey].push(entry);
  }

  const activeRubric = submission.cycle.rubricVersions.length > 0 ? submission.cycle.rubricVersions[0] : null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/evaluator/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Review: {submission.faculty.name}</h1>
          <p className="text-gray-500 text-sm">
            {submission.faculty.department} | {submission.cycle.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {studentFeedback.length > 0 && (
            <Card className="border-indigo-100 shadow-sm bg-indigo-50/20">
              <CardHeader className="pb-3 border-b border-indigo-100">
                <CardTitle className="text-lg text-indigo-900 flex items-center">
                  Student Feedback Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentFeedback.map(fb => (
                    <div key={fb.id} className="bg-white p-3 rounded border border-indigo-100 shadow-sm space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-800 text-sm truncate pr-2" title={fb.courseName}>
                          {fb.courseName}
                        </span>
                        <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          {fb.averageScore5.toFixed(2)} / 5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {fb.programme} • {fb.semesterOrTerm} • Responses: {fb.responseCount}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Submitted Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.keys(entriesByCategory).length === 0 ? (
                <p className="text-gray-500 text-sm">No entries submitted.</p>
              ) : (
                Object.keys(entriesByCategory).map(categoryKey => (
                  <div key={categoryKey} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 capitalize mb-4 pb-2 border-b border-gray-100">
                      {categoryKey.replace(/_/g, ' ')}
                    </h3>
                    <div className="space-y-4">
                      {entriesByCategory[categoryKey].map((entry, idx) => (
                        <div key={entry.id} className="bg-slate-50/50 border border-slate-100 p-4 rounded-md space-y-3">
                          <p className="font-semibold text-indigo-700 text-sm border-b border-indigo-100 pb-1 inline-block">Entry #{idx + 1}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(entry.dataJson as Record<string, any>).map(([k, v]) => (
                              <div key={k} className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                                <div className="text-sm bg-white p-2 rounded border border-slate-100 min-h-[36px]">
                                  {renderValue(v)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
           <GradingForm 
              submissionId={submission.id}
              rubric={activeRubric}
              existingEvaluation={submission.evaluation}
           />
        </div>
      </div>
    </div>
  );
}
