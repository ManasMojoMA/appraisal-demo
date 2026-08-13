"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Settings, Save, Download } from "lucide-react";
import type { FacultyFormCategory, FacultyFormField, FieldType, FacultyVisibleFormSchema } from "@/lib/form-builder-types";

const defaultSchema: FacultyVisibleFormSchema = {
  schemaVersion: "1.0",
  visibility: "faculty_visible_only",
  formTitle: "New Faculty Appraisal Form",
  formDescription: "Enter description here...",
  instructions: ["Please fill out all required fields.", "Provide evidence where necessary."],
  categoryActivationRule: {
    enabledCategoryMinEntries: 1,
    autoCreateFirstEntry: true,
    allAddedEntriesMustBeComplete: true,
    allowDisableCategoryBeforeSubmission: true,
  },
  categories: [],
};

const hardcodedSchema: FacultyVisibleFormSchema = {
  schemaVersion: "1.0",
  visibility: "faculty_visible_only",
  formTitle: "Standard Faculty Appraisal Form 2025",
  formDescription: "Comprehensive annual self-review for faculty members.",
  instructions: ["Please complete all enabled categories.", "Ensure all URLs and uploads are accessible."],
  categoryActivationRule: {
    enabledCategoryMinEntries: 1,
    autoCreateFirstEntry: true,
    allAddedEntriesMustBeComplete: true,
    allowDisableCategoryBeforeSubmission: true,
  },
  categories: [
    {
      key: "academic_delivery",
      label: "Academic Delivery",
      description: "Details regarding courses taught and academic responsibilities.\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "course_name", label: "Course Name", type: "text", required: true },
        { key: "section_number", label: "Section number", type: "text", required: true },
        { key: "credits", label: "Course Credits", type: "number", required: true },
        { key: "description", label: "Innovation in pedagogy: Live projects, guest sessions, experiential learning, etc.", type: "textarea", required: true }
      ]
    },
    {
      key: "research_publications",
      label: "Research & Publications",
      description: "Journal articles, conference papers, patents, Case Study, Book Chapter, and Book.\n(These should be considered for the academic year July 2025 to June 2026 only.)\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "title", label: "Publication/Research Title", type: "text", required: true },
        { key: "journal", label: "Journal/Conference Name", type: "text", required: true },
        { key: "descriptive_details", label: "Descriptive Details", type: "textarea", required: false },
        { key: "evidence_link", label: "Google Drive / OneDrive Link", type: "url", required: true, helpText: "Paste a shareable link. Ensure \"Anyone with the link\" can view it, otherwise the evaluator cannot access it and it may result in zero marks." }
      ]
    },
    {
      key: "innovation",
      label: "FDPs/MDPs/Seminars/Conferences/Workshops/etc conducted or attended",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "name", label: "Name of FDPs/MDPs/Seminars/Conferences/Workshops/etc", type: "text", required: true },
        { key: "type", label: "Type", type: "select", required: true, options: ["FDP", "MDP", "Seminar", "Conference", "Workshop", "Other"] },
        { key: "type_other", label: "Please specify Type", type: "text", required: true, visibilityLogic: { type: "Other" } },
        { key: "insights", label: "Insights", type: "textarea", required: true },
        { key: "title", label: "Title of the {{type}}", type: "text", required: true },
        { key: "start_date", label: "Start date", type: "date", required: true },
        { key: "end_date", label: "End date", type: "date", required: true },
        { key: "modality", label: "Modality", type: "select", required: true, options: ["Online", "Offline", "Hybrid"] },
        { key: "evidence_link", label: "Evidence of attendance", type: "url", required: true, helpText: "Provide Google Drive link. Make sure 'Anyone with the link' can view." },
        { key: "role", label: "Role", type: "select", required: true, options: ["Participant", "Presenter", "Session Chair", "Keynote speaker", "Other"] },
        { key: "role_other", label: "Please specify Role", type: "text", required: true, visibilityLogic: { role: "Other" } }
      ]
    },
    {
      key: "service_contribution_a",
      label: "Service Contribution Part A",
      description: "Institutional roles, committee memberships, and problem-solving contributions.\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "role_name", label: "Role/Committee Name", type: "text", required: true },
        { key: "problem_solved", label: "Responsibilities Assigned to the Role", type: "text", required: true },
        { key: "start_date", label: "Start Date of Role", type: "date", required: true },
        { key: "end_date", label: "End Date of Role (Optional)", type: "date", required: false },
        { key: "action_taken", label: "Action Taken and Impact Generated", type: "textarea", required: true },
      ],
    },
    {
      key: "service_contribution_b",
      label: "Service contribution Part B",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { 
          key: "industry_engagement", 
          label: "Industry engagement for the School", 
          type: "multi_select", 
          required: true, 
          hasDetails: true, 
          detailsPlaceholder: "Please share verifiable evidence of industry engagement, specifying the date, stakeholders involved, activity conducted, and any resulting outputs or impact",
          options: [
            "High-impact MoU", "Corporate Partnership", "Placement lead resulting in student benefit", 
            "Live Project", "Consulting Assignment", "Certification collaboration", "Guest Lecture", 
            "Industry Talk", "Arranged Panel Participation", "Industry Visit", "Arranged Field Exposure", 
            "Advisory input from industry for curriculum", "Course improvement", "Other"
          ] 
        }
      ]
    },
    {
      key: "service_contribution_c",
      label: "Service contribution Part C",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { 
          key: "institutional_initiatives", 
          label: "Institutional initiatives for the School", 
          type: "multi_select", 
          required: true, 
          hasDetails: true,
          options: [
            "New academic process or policy development", "Student engagement initiatives", 
            "Accreditation or ranking support", "Community outreach", "School branding activities", 
            "Interdisciplinary events", "Research seminars or academic conclaves", 
            "Alumni engagement support", "Quality improvement projects", 
            "Technology/process improvement initiatives"
          ] 
        }
      ]
    },
    {
      key: "substitution_details",
      label: "Substitution Details",
      description: "Academic year July 2025 to June 2026\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "days", label: "Number of days substitution taken", type: "text", required: true },
        { key: "classes", label: "Number of classes for which substitution was taken", type: "text", required: true },
        { key: "reason", label: "Reason of substitution (list all reasons)", type: "textarea", required: true }
      ]
    }
  ],
};

export default function TemplateBuilder() {
  const router = useRouter();
  const [schema, setSchema] = useState<FacultyVisibleFormSchema>(defaultSchema);
  const [cycleId, setCycleId] = useState("");
  const [version, setVersion] = useState("1");
  const [cycles, setCycles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCycles() {
      try {
        const res = await fetch("/api/admin/cycles");
        if (res.ok) {
          const data = await res.json();
          const list = data.cycles || [];
          setCycles(list);
          if (list.length > 0) {
            const base = list.find((c: any) => c.id === "base-cycle");
            setCycleId(base ? base.id : list[0].id);
          } else {
            setCycleId("base-cycle");
          }
        } else {
          setCycleId("base-cycle");
        }
      } catch (error) {
        console.error("Failed to load cycles", error);
        setCycleId("base-cycle");
      }
    }
    loadCycles();
  }, []);

  const importHardcoded = () => {
    setSchema(hardcodedSchema);
    toast.success("Imported hardcoded schema successfully");
  };

  const saveTemplate = async () => {
    if (!cycleId) {
      toast.error("Please enter a Cycle ID (can be any string for now)");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId,
          version,
          title: schema.formTitle,
          description: schema.formDescription,
          instructions: schema.instructions,
          schemaJson: schema,
          updatedSchema: schema,
          isActive: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to save template");
      
      toast.success("Template saved successfully");
      router.push("/admin/templates");
    } catch (error: any) {
      toast.error("Error saving template", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    const newCategory: FacultyFormCategory = {
      key: `section_${Date.now()}`,
      label: "New Section",
      description: "",
      canBeEnabledByFaculty: true,
      minEntriesWhenEnabled: 1,
      fields: [],
    };
    setSchema({ ...schema, categories: [...schema.categories, newCategory] });
  };

  const updateCategory = (index: number, updates: Partial<FacultyFormCategory>) => {
    const newCategories = [...schema.categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    setSchema({ ...schema, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    const newCategories = [...schema.categories];
    newCategories.splice(index, 1);
    setSchema({ ...schema, categories: newCategories });
  };

  const addField = (catIndex: number) => {
    const newField: FacultyFormField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    const newCategories = [...schema.categories];
    newCategories[catIndex].fields.push(newField);
    setSchema({ ...schema, categories: newCategories });
  };

  const updateField = (catIndex: number, fieldIndex: number, updates: Partial<FacultyFormField>) => {
    const newCategories = [...schema.categories];
    newCategories[catIndex].fields[fieldIndex] = { ...newCategories[catIndex].fields[fieldIndex], ...updates };
    setSchema({ ...schema, categories: newCategories });
  };

  const removeField = (catIndex: number, fieldIndex: number) => {
    const newCategories = [...schema.categories];
    newCategories[catIndex].fields.splice(fieldIndex, 1);
    setSchema({ ...schema, categories: newCategories });
  };

  const moveField = (catIndex: number, fieldIndex: number, direction: 'up' | 'down') => {
    const newCategories = [...schema.categories];
    const fields = newCategories[catIndex].fields;
    if (direction === 'up' && fieldIndex > 0) {
      [fields[fieldIndex - 1], fields[fieldIndex]] = [fields[fieldIndex], fields[fieldIndex - 1]];
    } else if (direction === 'down' && fieldIndex < fields.length - 1) {
      [fields[fieldIndex], fields[fieldIndex + 1]] = [fields[fieldIndex + 1], fields[fieldIndex]];
    }
    setSchema({ ...schema, categories: newCategories });
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Template Builder</h1>
          <p className="text-muted-foreground mt-1">
            Design dynamic appraisal schemas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importHardcoded} className="gap-2">
            <Download className="h-4 w-4" />
            Import Sample Template
          </Button>
          <Button onClick={saveTemplate} disabled={isSaving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-gray-50 border-b pb-4">
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Appraisal Cycle Association</Label>
                {cycles.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                    No custom cycles found. Associating with System Base Cycle.
                  </div>
                ) : (
                  <Select value={cycleId} onValueChange={(val) => setCycleId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an Appraisal Cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.academicYear})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input type="number" value={version} onChange={(e) => setVersion(e.target.value)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input value={schema.formTitle} onChange={(e) => setSchema({ ...schema, formTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Form Description</Label>
                <Textarea value={schema.formDescription} onChange={(e) => setSchema({ ...schema, formDescription: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {schema.categories.map((category, catIndex) => (
            <Card key={catIndex} className="border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
              <CardHeader className="bg-gray-50/50 pb-4 border-b">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <Input 
                      value={category.label} 
                      onChange={(e) => updateCategory(catIndex, { label: e.target.value })}
                      className="font-semibold text-lg bg-transparent border-transparent hover:border-gray-300 focus:bg-white"
                    />
                    <Input 
                      value={category.key} 
                      onChange={(e) => updateCategory(catIndex, { key: e.target.value })}
                      className="text-sm font-mono text-muted-foreground h-8 bg-transparent border-transparent hover:border-gray-300 focus:bg-white bg-gray-50/50"
                      placeholder="category_key"
                      disabled
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeCategory(catIndex)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 bg-gray-50/30">
                <div className="space-y-2 mb-6">
                  <Label>Section Description</Label>
                  <Textarea 
                    value={category.description} 
                    onChange={(e) => updateCategory(catIndex, { description: e.target.value })}
                    className="h-20 bg-white"
                  />
                </div>
                
                <div className="flex items-center space-x-2 mb-6">
                  <Checkbox 
                    id={`canBeEnabled_${catIndex}`} 
                    checked={category.canBeEnabledByFaculty} 
                    onCheckedChange={(c) => updateCategory(catIndex, { canBeEnabledByFaculty: !!c })} 
                  />
                  <Label htmlFor={`canBeEnabled_${catIndex}`}>Can be enabled/disabled by faculty (Optional section)</Label>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Fields</h4>
                  {category.fields.map((field, fieldIndex) => (
                    <Card key={fieldIndex} className="border border-gray-200">
                      <CardContent className="p-4 flex gap-4 items-start">
                        <div className="flex flex-col gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(catIndex, fieldIndex, 'up')} disabled={fieldIndex === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(catIndex, fieldIndex, 'down')} disabled={fieldIndex === category.fields.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Field Label</Label>
                              <Input value={field.label} onChange={(e) => updateField(catIndex, fieldIndex, { label: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Field Key</Label>
                              <Input value={field.key} onChange={(e) => updateField(catIndex, fieldIndex, { key: e.target.value })} className="font-mono text-xs bg-gray-50" disabled />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Field Type</Label>
                              <Select value={field.type} onValueChange={(v) => updateField(catIndex, fieldIndex, { type: v as FieldType })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-auto min-w-[200px]">
                                  <SelectItem value="text">Short Text</SelectItem>
                                  <SelectItem value="textarea">Long Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="select">Dropdown</SelectItem>
                                  <SelectItem value="multi_select">Checkbox/Multi-select</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="url">URL Link</SelectItem>
                                  <SelectItem value="evidence">File Upload (Evidence)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-5">
                              <Checkbox id={`req_${catIndex}_${fieldIndex}`} checked={field.required} onCheckedChange={(c) => updateField(catIndex, fieldIndex, { required: !!c })} />
                              <Label htmlFor={`req_${catIndex}_${fieldIndex}`} className="text-xs">Required</Label>
                            </div>
                          </div>
                          
                          {(field.type === "select" || field.type === "multi_select") && (
                            <div className="space-y-1">
                              <Label className="text-xs">Options (comma separated)</Label>
                              <Input 
                                value={field.options?.join(", ") || ""} 
                                onChange={(e) => updateField(catIndex, fieldIndex, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeField(catIndex, fieldIndex)} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outline" size="sm" onClick={() => addField(catIndex)} className="w-full border-dashed gap-2 mt-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addCategory} className="w-full border-dashed py-8 gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="h-5 w-5" />
            Add New Section
          </Button>
        </div>
      </div>
    </div>
  );
}
