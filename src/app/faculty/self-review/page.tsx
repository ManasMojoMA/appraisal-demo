"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategoryCard } from "@/components/faculty/CategoryCard";
import { validateFacultySubmission } from "@/lib/validation-rules";
import type {
  FacultySubmissionState,
  FacultyVisibleFormSchema,
  ValidationIssue,
} from "@/lib/form-builder-types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";



export default function SelfReviewForm() {
  const [schema, setSchema] = useState<FacultyVisibleFormSchema | null>(null);
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [formTemplateId, setFormTemplateId] = useState<string>("");
  const [submission, setSubmission] = useState<FacultySubmissionState>({
    enabledCategories: [],
    entriesByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<string>("draft");
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load active cycle and existing submission
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/faculty/active-cycle");
        if (res.ok) {
          const data = await res.json();
          setCycleInfo(data.cycle);
          setFormTemplateId(data.formTemplate.id);
          setSchema(data.formTemplate.schemaJson as FacultyVisibleFormSchema);

          if (data.submission) {
            const isPast = new Date() > new Date(data.cycle.deadline);
            setIsPastDeadline(isPast);
            
            if (isPast && data.submission.status !== "submitted") {
              setSubmissionStatus("locked");
            } else {
              setSubmissionStatus(data.submission.status);
            }
            
            // Reconstruct state from DB submission
            const initialSchema = data.formTemplate.schemaJson as FacultyVisibleFormSchema;
            const requiredCats = (initialSchema.categories || [])
              .filter((c) => !c.canBeEnabledByFaculty)
              .map((c) => c.key);

            const dbCategories = data.submission.entries.map((e: any) => e.categoryKey);
            const enabledCategories = [
              ...new Set<string>([...dbCategories, ...requiredCats]),
            ];

            const entriesByCategory: Record<string, any[]> = {};
            // Initialize required categories with empty list so they exist in state
            requiredCats.forEach((key) => {
              entriesByCategory[key] = [];
            });

            for (const entry of data.submission.entries) {
              if (!entriesByCategory[entry.categoryKey]) {
                entriesByCategory[entry.categoryKey] = [];
              }
              entriesByCategory[entry.categoryKey].push({
                entryId: entry.id,
                categoryKey: entry.categoryKey,
                values: entry.dataJson,
              });
            }

            // Seed initial entry for required categories if empty
            requiredCats.forEach((key) => {
              if (!entriesByCategory[key] || entriesByCategory[key].length === 0) {
                entriesByCategory[key] = [{ entryId: uuidv4(), categoryKey: key, values: {} }];
              }
            });

            setSubmission({ enabledCategories, entriesByCategory });
          } else {
            // Initialize with required categories and auto-created first entries
            const initialSchema = data.formTemplate.schemaJson as FacultyVisibleFormSchema;
            const requiredCats = (initialSchema.categories || [])
              .filter((c) => !c.canBeEnabledByFaculty)
              .map((c) => c.key);
            
            const initialEntries: Record<string, any[]> = {};
            requiredCats.forEach((key) => {
              initialEntries[key] = [{ entryId: uuidv4(), categoryKey: key, values: {} }];
            });

            setSubmission({ enabledCategories: requiredCats, entriesByCategory: initialEntries });
          }
        } else {
          toast.error("Failed to load active appraisal cycle.");
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred loading the form.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Validate on every change
  useEffect(() => {
    if (schema) {
      const issues = validateFacultySubmission(schema, submission);
      setValidationIssues(issues);
    }
  }, [submission, schema]);

  const isDirtyRef = useRef(false);
  const isReadOnly = submissionStatus === "submitted" || submissionStatus === "locked" || (isPastDeadline && submissionStatus !== "reopened");

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !isReadOnly) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReadOnly]);

  // Autosave API Call
  const saveSubmission = async (isFinalSubmit = false) => {
    if (!cycleInfo || !schema) return;
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/faculty/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: cycleInfo.id,
          formTemplateId,
          isFinalSubmit,
          submissionState: submission,
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
        isDirtyRef.current = false;
        if (isFinalSubmit) {
          setSubmissionStatus("submitted");
          toast.success("Submission successful! Your self-review is now locked.");
          window.location.href = "/faculty/dashboard";
        }
      } else {
        toast.error("Failed to save draft.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = useCallback(() => {
    saveSubmission(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission, cycleInfo, schema]);

  useEffect(() => {
    if (isLoading || isReadOnly) return;
    const timer = setTimeout(() => {
      debouncedSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [submission, debouncedSave, isLoading, isReadOnly]);

  const handleCategoryToggle = (categoryKey: string, enabled: boolean) => {
    if (isReadOnly) return;
    isDirtyRef.current = true;
    setSubmission((prev) => {
      const newEnabled = enabled
        ? [...prev.enabledCategories, categoryKey]
        : prev.enabledCategories.filter((k) => k !== categoryKey);

      const newEntries = { ...prev.entriesByCategory };
      if (enabled && (!newEntries[categoryKey] || newEntries[categoryKey].length === 0)) {
        newEntries[categoryKey] = [
          { entryId: uuidv4(), categoryKey, values: {} },
        ];
      }

      return { ...prev, enabledCategories: newEnabled, entriesByCategory: newEntries };
    });
  };

  const handleEntriesChange = (categoryKey: string, entries: any[]) => {
    if (isReadOnly) return;
    isDirtyRef.current = true;
    setSubmission((prev) => ({
      ...prev,
      entriesByCategory: {
        ...prev.entriesByCategory,
        [categoryKey]: entries,
      },
    }));
  };

  const handleFinalSubmit = () => {
    if (validationIssues.length > 0) {
      toast.error("Please fix all validation errors before submitting.");
      return;
    }
    isDirtyRef.current = false;
    saveSubmission(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#F3E7DE] pb-6">
          <div className="space-y-2">
            <div className="h-8 w-80 bg-gray-200 rounded-md"></div>
            <div className="h-4 w-96 bg-gray-200 rounded-md mt-2"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200"></div>

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-1 bg-gray-100 w-full rounded-full"></div>
              <div className="space-y-3 pt-2">
                <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!schema) {
    return <div className="p-8 text-[#E3120B]">Failed to load form schema.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#F3E7DE] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            {schema.formTitle}
          </h1>
          <p className="mt-2 text-[#6B7280]">{schema.formDescription}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#6B7280] flex items-center gap-1.5">
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                Saving draft...
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Saved at {lastSaved.toLocaleTimeString()}
              </>
            ) : null}
          </div>
          <Button
            onClick={handleFinalSubmit}
            disabled={isReadOnly || validationIssues.length > 0 || isSaving}
            className="bg-[#E3120B] hover:bg-[#930202] text-white"
          >
            <Send className="mr-2 h-4 w-4" /> Final Submit
          </Button>
        </div>
      </div>

      {isReadOnly && (
        <Alert className={isPastDeadline && submissionStatus !== "submitted" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}>
          {isPastDeadline && submissionStatus !== "submitted" ? (
             <AlertCircle className="h-4 w-4 stroke-red-800" />
          ) : (
             <CheckCircle2 className="h-4 w-4 stroke-green-800" />
          )}
          <AlertTitle className="font-semibold text-inherit">{isPastDeadline && submissionStatus !== "submitted" ? "Deadline Passed" : "Appraisal Submitted"}</AlertTitle>
          <AlertDescription>
            {isPastDeadline && submissionStatus !== "submitted" ? "The deadline for this appraisal cycle has passed. You can no longer edit your submission." : "Your self-review appraisal has been successfully submitted and is locked for editing."}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Alert className="bg-[#FFF4E6] border-[#FB8E07] text-[#930202]">
        <AlertCircle className="h-4 w-4 stroke-[#930202]" />
        <AlertTitle className="font-semibold">Instructions</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            {(schema.instructions || []).map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {/* Dynamic Categories */}
      <div className="space-y-8">
        {schema.categories.map((category) => (
          <CategoryCard
            key={category.key}
            category={category}
            isEnabled={submission.enabledCategories.includes(category.key)}
            entries={submission.entriesByCategory[category.key] || []}
            validationIssues={validationIssues}
            onToggle={(enabled) => handleCategoryToggle(category.key, enabled)}
            onEntriesChange={(entries) => handleEntriesChange(category.key, entries)}
            disabled={isReadOnly}
          />
        ))}
      </div>

      {/* Footer sticky bar */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 p-4 -mx-8 mt-12 flex justify-between items-center px-12">
        <div className="flex items-center gap-2">
          {isReadOnly ? (
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Locked & Submitted
            </span>
          ) : validationIssues.length > 0 ? (
            <span className="text-sm font-medium text-[#E3120B] flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {validationIssues.length} field(s) remaining
            </span>
          ) : (
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Ready to submit
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => saveSubmission(false)} disabled={isReadOnly || isSaving}>
            <Save className="h-4 w-4" /> Force Save
          </Button>
          <Button
            onClick={handleFinalSubmit}
            disabled={isReadOnly || validationIssues.length > 0 || isSaving}
            className="bg-[#E3120B] hover:bg-[#930202] text-white"
          >
            Submit Appraisal
          </Button>
        </div>
      </div>
    </div>
  );
}
