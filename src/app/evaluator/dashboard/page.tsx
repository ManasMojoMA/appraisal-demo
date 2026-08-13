import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActivityLogsWidget } from "@/components/dashboard/ActivityLogsWidget";

export default async function EvaluatorDashboard() {
  // Fetch active cycle
  const activeCycle = await prisma.appraisalCycle.findFirst({
    where: { status: { in: ["open", "evaluation"] } },
    orderBy: { createdAt: "desc" },
  });

  let pendingReviews = 0;
  let completedReviews = 0;
  let submittedForms: any[] = [];

  if (activeCycle) {
    // Get all submitted forms for this cycle and include their evaluations
    submittedForms = await prisma.facultySubmission.findMany({
      where: { 
        cycleId: activeCycle.id,
        status: "submitted" 
      },
      include: {
        faculty: true,
        evaluation: true,
      },
      orderBy: { submittedAt: "asc" }
    });
    
    // Calculate accurate counts
    pendingReviews = submittedForms.filter((form: any) => !form.evaluation || form.evaluation.finalStatus !== "evaluated").length;
    completedReviews = submittedForms.filter((form: any) => form.evaluation && form.evaluation.finalStatus === "evaluated").length;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#08111F]">Evaluator Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome to the evaluation portal.</p>
        </div>
        <ActivityLogsWidget />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-t-4 border-t-blue-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{pendingReviews}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Reviews</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#08111F]">{completedReviews}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions to Review</CardTitle>
        </CardHeader>
        <CardContent>
          {submittedForms.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No pending submissions to review at this time.</p>
          ) : (
            <div className="space-y-4">
              {submittedForms.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-[#08111F]">{submission.faculty.name}</p>
                    <p className="text-sm text-gray-500">{submission.faculty.department} | Submitted: {submission.submittedAt?.toLocaleDateString()}</p>
                  </div>
                  <Link href={`/evaluator/review/${submission.id}`} className={buttonVariants({ size: "sm", variant: submission.evaluation?.finalStatus === "evaluated" ? "secondary" : "default" })}>
                    {submission.evaluation?.finalStatus === "evaluated" ? "View Evaluation" : "Evaluate"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
