"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GradingFormProps {
  submissionId: string;
  rubric: any;
  existingEvaluation?: any;
}

export function GradingForm({ submissionId, rubric, existingEvaluation }: GradingFormProps) {
  const router = useRouter();
  const isFinalized = existingEvaluation?.finalStatus === "evaluated" || existingEvaluation?.finalStatus === "finalized";
  
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (existingEvaluation) {
      return {
        teaching: Number(existingEvaluation.teachingStudentFeedbackMarks) || 0,
        academic_delivery: Number(existingEvaluation.academicDeliveryMarks) || 0,
        innovation: Number(existingEvaluation.innovationMarks) || 0,
        research_publications: Number(existingEvaluation.researchMarks) || 0,
        service_contribution: Number(existingEvaluation.serviceMarks) || 0,
        penalty: Number(existingEvaluation.penaltyMarks) || 0,
      } as Record<string, number>;
    }
    return {} as Record<string, number>;
  });

  const [notes, setNotes] = useState(existingEvaluation?.evaluatorNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotal = () => {
    let total = 0;
    if (rubric?.configJson?.categories) {
      rubric.configJson.categories.forEach((cat: any) => {
        total += (scores[cat.key] || 0);
      });
    }
    // Subtract penalties if any
    total -= (scores.penalty || 0);
    return Math.max(0, total); // Prevent negative total
  };

  const handleSave = async (status: "draft" | "evaluated") => {
    if (status === "evaluated") {
      if (!confirm("Are you sure you want to finalize this evaluation? You will not be able to change scores after finalizing.")) {
        return;
      }
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }

    try {
      const res = await fetch("/api/evaluator/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          rubricVersionId: rubric.id,
          scores,
          evaluatorNotes: notes,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save evaluation");
      }

      toast.success(status === "evaluated" ? "Evaluation Finalized!" : "Draft Saved");
      router.refresh();
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  if (!rubric || !rubric.configJson) {
    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="text-red-600">No Grading Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            An administrator has not assigned a grading rubric to this cycle. You cannot score this submission yet.
          </p>
          <Button className="w-full" disabled>Submit Evaluation</Button>
        </CardContent>
      </Card>
    );
  }

  const { maxTotalMarks, passingMarks, categories } = rubric.configJson;
  const currentTotal = calculateTotal();

  return (
    <Card className="sticky top-6 border-indigo-100 shadow-lg">
      <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Evaluation Panel</CardTitle>
            <CardDescription className="mt-1">
              Based on: <span className="font-semibold text-indigo-700">{rubric.name}</span>
            </CardDescription>
          </div>
          {isFinalized && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Finalized
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto p-4 space-y-4">
          
          {categories.map((cat: any) => (
            <div key={cat.key} className="pt-4 first:pt-0 space-y-2">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-semibold text-gray-900">{cat.label}</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0" 
                    max={cat.maxMarks}
                    className="w-20 h-8 text-right font-semibold text-indigo-700 focus-visible:ring-indigo-500"
                    value={scores[cat.key] === undefined ? "" : scores[cat.key]}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 0;
                      if (val > cat.maxMarks) val = cat.maxMarks;
                      if (val < 0) val = 0;
                      setScores({...scores, [cat.key]: val});
                    }}
                    disabled={isFinalized}
                  />
                  <span className="text-xs text-gray-500 w-10">/ {cat.maxMarks}</span>
                </div>
              </div>
              {cat.description && (
                <p className="text-[11px] text-gray-500 italic leading-snug">
                  {cat.description}
                </p>
              )}
            </div>
          ))}

          <div className="pt-4 space-y-2">
             <div className="flex justify-between items-start">
                <Label className="text-sm font-semibold text-red-700">Penalty / Negative Marks</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0" 
                    className="w-20 h-8 text-right font-semibold text-red-700 border-red-200 focus-visible:ring-red-500"
                    value={scores.penalty === undefined ? "" : scores.penalty}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 0;
                      if (val < 0) val = 0;
                      setScores({...scores, penalty: val});
                    }}
                    disabled={isFinalized}
                  />
                  <span className="text-xs text-gray-500 w-10">/ ∞</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic leading-snug">
                Deduct marks for disciplinary issues or unverified claims.
              </p>
          </div>

          <div className="pt-4 space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Evaluator Notes</Label>
            <Textarea 
              placeholder="Add qualitative remarks, justification for scores, or feedback for the Dean..."
              className="min-h-[100px] resize-y text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isFinalized}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <span className="font-semibold text-gray-700">Total Score</span>
            <div className="text-right">
              <span className={`text-2xl font-bold ${currentTotal >= passingMarks ? 'text-green-600' : 'text-amber-600'}`}>
                {currentTotal}
              </span>
              <span className="text-sm text-gray-500 ml-1">/ {maxTotalMarks}</span>
            </div>
          </div>

          {!isFinalized && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={() => handleSave("draft")}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleSave("evaluated")}
                disabled={isSaving || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Finalize
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
