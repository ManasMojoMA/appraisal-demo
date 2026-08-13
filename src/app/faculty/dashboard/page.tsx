"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLogsWidget } from "@/components/dashboard/ActivityLogsWidget";

export default function FacultyDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/faculty/active-cycle");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-md"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="col-span-2 border border-[#F3E7DE]/50 rounded-lg p-6 bg-white space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-12 bg-gray-200 rounded-md"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-32 bg-gray-200 rounded-md ml-auto"></div>
                <div className="h-5 w-24 bg-gray-200 rounded-md ml-auto"></div>
              </div>
            </div>
          </div>

          <div className="border border-[#F3E7DE]/50 rounded-lg p-6 bg-white flex flex-col justify-center space-y-3">
            <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
            <div className="h-4 w-40 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-[#F3E7DE] rounded-lg p-5 bg-white flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.cycle) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
              Welcome back, Faculty
            </h1>
            <p className="mt-2 text-[#6B7280]">
              Manage your annual performance appraisal self-review.
            </p>
          </div>
          <ActivityLogsWidget />
        </div>
        
        <Card className="border border-[#F3E7DE] shadow-sm bg-white p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-[#FB8E07]">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#111827]">
              No Active Cycle Assigned
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              You do not have any active performance appraisal cycles assigned to your account at this time. Please contact the Program Office at <span className="font-semibold text-slate-700">appraisal.support@northbridge.demo</span> if you believe this is an error.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { cycle, submission, formTemplate } = data;

  const progress: Record<string, { enabled: boolean; complete: boolean }> = {};
  if (submission?.entries) {
    submission.entries.forEach((entry: any) => {
      progress[entry.categoryKey] = {
        enabled: true,
        complete: submission.status === "submitted", // For now, treat enabled categories as complete if submitted
      };
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Welcome back, Faculty
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Manage your annual performance appraisal self-review.
          </p>
        </div>
        <ActivityLogsWidget />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="col-span-2 border-[#F3E7DE] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-[#111827]">
              Current Cycle: {cycle.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Status</p>
                <div className="mt-1 flex items-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                    submission?.status === 'submitted' 
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-blue-50 text-blue-700 ring-blue-700/10'
                  }`}>
                    {submission?.status === 'submitted' ? 'Submitted' : 'Drafting'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6B7280]">Submission Deadline</p>
                <p className="mt-1 font-medium text-[#111827]">
                  {new Date(cycle.deadline).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {" at "}
                  {new Date(cycle.deadline).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#F3E7DE] shadow-sm bg-[#FFF4E6] border-l-4 border-l-[#FB8E07]">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <CountdownTimer deadline={cycle.deadline} />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#111827]">Category Progress</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {formTemplate?.schemaJson?.categories?.map((category: any) => (
          <ProgressCard
            key={category.key}
            title={category.label}
            enabled={progress[category.key]?.enabled ?? false}
            complete={progress[category.key]?.complete ?? false}
          />
        ))}
      </div>

      <div className="flex justify-end">
        {submission?.status !== 'submitted' && (
          <Link href="/faculty/self-review">
            <Button className="bg-[#E3120B] hover:bg-[#930202] text-white gap-2">
              Continue Self Review <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function ProgressCard({
  title,
  enabled,
  complete,
}: {
  title: string;
  enabled: boolean;
  complete: boolean;
}) {
  return (
    <Card className="border-[#F3E7DE] shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[#111827]">{title}</h3>
          <p className="text-sm text-[#6B7280]">
            {!enabled ? "Not Started" : complete ? "Completed" : "In Progress"}
          </p>
        </div>
        <div>
          {!enabled ? (
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">-</span>
            </div>
          ) : complete ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-[#FB8E07]" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = new Date(deadline).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft("Deadline Passed");
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex flex-col ${isPast ? 'text-[#930202]' : 'text-[#E3120B]'}`}>
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6" />
        <span className="text-2xl font-bold">{timeLeft}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-[#930202]">
        {isPast ? "Deadline has passed" : "Time remaining to submit"}
      </p>
    </div>
  );
}
