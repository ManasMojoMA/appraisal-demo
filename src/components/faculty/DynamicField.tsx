"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, UploadCloud, Loader2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FacultyFormField } from "@/lib/form-builder-types";

interface DynamicFieldProps {
  field: FacultyFormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: DynamicFieldProps) {
  const { key, label, type, required, placeholder, helpText, options, min, max } = field;
  const [isUploading, setIsUploading] = useState(false);

  const evidenceObj = (() => {
    if (type !== "evidence") return { type: "link" as const, linkUrl: "", uploadedFiles: [] };
    if (!value) return { type: "link" as const, linkUrl: "", uploadedFiles: [] };
    if (typeof value === "object") {
      return {
        type: (value.type || "link") as "link" | "upload",
        linkUrl: value.linkUrl || "",
        uploadedFiles: value.uploadedFiles || [],
      };
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === "object") {
            return {
              type: (parsed.type || "link") as "link" | "upload",
              linkUrl: parsed.linkUrl || "",
              uploadedFiles: parsed.uploadedFiles || [],
            };
          }
        } catch {}
      }
      return { type: "link" as const, linkUrl: value, uploadedFiles: [] };
    }
    return { type: "link" as const, linkUrl: "", uploadedFiles: [] };
  })();

  const handleLinkChange = (url: string) => {
    onChange({
      type: "link",
      linkUrl: url,
      uploadedFiles: evidenceObj.uploadedFiles,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("File exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    if (evidenceObj.uploadedFiles.length >= 3) {
      toast.error("You can upload a maximum of 3 files per entry.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newFiles = [
          ...evidenceObj.uploadedFiles,
          {
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize,
          },
        ];
        onChange({
          type: "upload",
          linkUrl: evidenceObj.linkUrl,
          uploadedFiles: newFiles,
        });
        toast.success(`Successfully uploaded ${data.fileName}`);
      } else {
        toast.error(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during file upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = evidenceObj.uploadedFiles.filter((_: any, idx: number) => idx !== indexToRemove);
    onChange({
      type: "upload",
      linkUrl: evidenceObj.linkUrl,
      uploadedFiles: newFiles,
    });
    toast.success("File removed");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={key} className={`text-sm font-medium ${error ? "text-[#E3120B]" : "text-[#111827]"}`}>
          {label}
        </Label>
        {required && <span className="text-[#E3120B]">*</span>}
      </div>

      {type === "text" && (
        <Input
          id={key}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={error ? "border-[#E3120B] focus-visible:ring-[#E3120B]" : ""}
          disabled={disabled}
        />
      )}

      {type === "textarea" && (
        <Textarea
          id={key}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`min-h-[100px] resize-y ${error ? "border-[#E3120B] focus-visible:ring-[#E3120B]" : ""}`}
          disabled={disabled}
        />
      )}

      {type === "number" && (
        <Input
          id={key}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={error ? "border-[#E3120B] focus-visible:ring-[#E3120B]" : ""}
          disabled={disabled}
        />
      )}

      {type === "date" && (
        <Input
          id={key}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "border-[#E3120B] focus-visible:ring-[#E3120B]" : ""}
          disabled={disabled}
        />
      )}

      {type === "url" && (
        <Input
          id={key}
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          className={error ? "border-[#E3120B] focus-visible:ring-[#E3120B]" : ""}
          disabled={disabled}
        />
      )}

      {type === "select" && options && (
        <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={error ? "border-[#E3120B] focus:ring-[#E3120B]" : ""}>
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "multi_select" && options && (
        <div className="flex flex-col gap-2 p-3 border rounded-md">
          {options.map((opt) => {
            const selectedItem = Array.isArray(value) ? value.find((v) => typeof v === 'object' ? v.option === opt : v === opt) : null;
            const isChecked = !!selectedItem;

            return (
              <div key={opt} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${opt}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        const newItem = field.hasDetails ? { option: opt, details: "" } : opt;
                        onChange([...currentValues, newItem]);
                      } else {
                        onChange(currentValues.filter((v) => (typeof v === 'object' ? v.option !== opt : v !== opt)));
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${key}-${opt}`} className="text-sm font-normal">
                    {opt}
                  </Label>
                </div>
                {isChecked && field.hasDetails && (
                  <Textarea
                    placeholder={field.detailsPlaceholder || "Please provide details..."}
                    value={typeof selectedItem === 'object' ? selectedItem.details : ""}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      onChange(currentValues.map((v) => 
                        (typeof v === 'object' && v.option === opt) ? { ...v, details: e.target.value } : 
                        (v === opt ? { option: opt, details: e.target.value } : v)
                      ));
                    }}
                    className="ml-6 min-h-[80px] text-sm resize-y"
                    disabled={disabled}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

       {type === "evidence" && (
        <div className="space-y-3 p-4 border rounded-md bg-[#FFFDF7]">
          <Tabs 
            value={evidenceObj.type} 
            onValueChange={(val) => {
              if (!disabled) {
                onChange({ ...evidenceObj, type: val as "link" | "upload" });
              }
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Provide Link</TabsTrigger>
              <TabsTrigger value="upload" disabled={disabled}>Upload File (Max 3)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Drive Link / URL</Label>
                <Input
                  type="url"
                  value={evidenceObj.linkUrl}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="https://..."
                  className={error ? "border-[#E3120B]" : ""}
                  disabled={disabled}
                />
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-2 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 font-medium">
                    If you are submitting a Google Drive, OneDrive, or any cloud storage link, ensure the access is set to &quot;Anyone with the link can view&quot; before submitting. 
                    <br/><br/>
                    Restricted links cannot be viewed by the evaluator and may result in zero marks for this entry.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className="pt-4 space-y-4">
              <div className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50/80 transition-colors relative ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-600">Uploading file...</p>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-full ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-700 font-semibold">{disabled ? "Upload locked" : "Click to upload file"}</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, Word, or Image (Max 5MB each)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={disabled || evidenceObj.uploadedFiles.length >= 3}
                    />
                  </label>
                )}
              </div>

              {/* Uploaded Files List */}
              {evidenceObj.uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Evidence ({evidenceObj.uploadedFiles.length}/3)</p>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg bg-white overflow-hidden">
                    {evidenceObj.uploadedFiles.map((file: any, index: number) => (
                       <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate max-w-[220px] md:max-w-[280px]" title={file.fileName}>{file.fileName}</p>
                              <p className="text-[10px] text-slate-400">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveFile(index)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {helpText && <p className="text-xs text-[#6B7280]">{helpText}</p>}
      {error && <p className="text-xs font-medium text-[#E3120B]">{error}</p>}
    </div>
  );
}
