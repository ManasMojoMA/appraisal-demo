"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function StudentFeedbackPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    async function fetchCycles() {
      try {
        const res = await fetch("/api/admin/cycles");
        const data = await res.json();
        setCycles(data.cycles || []);
        if (data.cycles && data.cycles.length > 0) {
          // Default to the first open cycle
          const active = data.cycles.find((c: any) => c.status === "open" || c.status === "evaluation");
          setSelectedCycle(active ? active.id : data.cycles[0].id);
        }
      } catch (error) {
        toast.error("Failed to fetch cycles");
      }
    }
    fetchCycles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
      setUploadResult(null);
    }
  };

  const handleParseAndUpload = () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }
    if (!selectedCycle) {
      toast.error("Please select an appraisal cycle");
      return;
    }

    setIsParsing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsParsing(false);
        const data = results.data as any[];
        
        if (data.length === 0) {
          toast.error("The CSV file is empty");
          return;
        }

        // Map CSV headers to our schema (Flexible matching)
        const mappedRecords = data.map((row) => {
          // Helper to find key case-insensitively or with spaces
          const getVal = (possibleKeys: string[]) => {
            const key = Object.keys(row).find(k => possibleKeys.some(pk => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pk)));
            return key ? row[key] : "";
          };

          return {
            facultyEmail: getVal(['email', 'facultyemail', 'user']),
            facultyName: getVal(['name', 'facultyname', 'faculty']),
            programme: getVal(['program', 'course', 'degree']),
            semesterOrTerm: getVal(['semester', 'term', 'sem']),
            courseCode: getVal(['coursecode', 'subjectcode']),
            courseName: getVal(['coursename', 'subjectname', 'subject']),
            section: getVal(['section', 'batch']),
            feedbackRound: getVal(['round', 'type', 'feedbackround']),
            averageScore5: parseFloat(getVal(['score', 'average', 'rating', 'out of 5'])) || 0,
            responseCount: parseInt(getVal(['responses', 'count', 'students'])) || 0,
            rawRowJson: row
          };
        });

        // Filter out obviously invalid rows
        const validRecords = mappedRecords.filter(r => r.facultyEmail && r.courseName);

        if (validRecords.length === 0) {
          toast.error("Could not find required columns (Email, Course Name). Please check your CSV format.");
          return;
        }

        setParsedData(validRecords);
        await uploadData(validRecords);
      },
      error: (error) => {
        setIsParsing(false);
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const uploadData = async (records: any[]) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          fileName: file?.name || "upload.csv",
          records: records
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to import records");
      }
      
      setUploadResult(data.summary);
      if (data.summary.errorCount === 0) {
        toast.success(`Successfully imported ${data.summary.successCount} records!`);
      } else {
        toast.warning(`Imported ${data.summary.successCount} records, but ${data.summary.errorCount} failed.`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Feedback Import</h1>
        <p className="text-muted-foreground mt-1">
          Upload bulk student feedback scores via CSV to automatically attach them to faculty appraisals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            The system will automatically try to match column names like "Email", "Course Name", "Average Score", etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Target Appraisal Cycle</Label>
            <Select value={selectedCycle} onValueChange={(val) => setSelectedCycle(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cycle..." />
              </SelectTrigger>
              <SelectContent>
                {cycles.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>CSV File</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="csv-upload" 
                onChange={handleFileChange}
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <FileSpreadsheet className="h-10 w-10 text-indigo-500 mb-3" />
                <span className="text-sm font-medium text-slate-700">
                  {file ? file.name : "Click to select a .csv file"}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Ensure the file contains Faculty Email, Course Name, and Score out of 5
                </span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleParseAndUpload}
            disabled={!file || isParsing || isUploading}
          >
            {isParsing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</>
            ) : isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><UploadCloud className="w-4 h-4 mr-2" /> Upload & Import</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {uploadResult && (
        <Card className={uploadResult.errorCount === 0 ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              {uploadResult.errorCount === 0 ? (
                <><CheckCircle2 className="w-5 h-5 mr-2 text-green-600" /> Import Complete</>
              ) : (
                <><AlertTriangle className="w-5 h-5 mr-2 text-amber-600" /> Import Finished with Errors</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>Successfully Imported:</strong> {uploadResult.successCount} rows</p>
            {uploadResult.errorCount > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-amber-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> 
                  Failed Rows ({uploadResult.errorCount}):
                </p>
                <ul className="list-disc pl-5 text-amber-700 max-h-32 overflow-y-auto">
                  {uploadResult.errors?.map((err: any, i: number) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                  {uploadResult.errorCount > 10 && <li>...and more</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
