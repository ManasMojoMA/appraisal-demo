"use client";

import { useState, useEffect, use } from "react";
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
import { Plus, Trash2, ArrowUp, ArrowDown, Settings, Save, Download, Loader2 } from "lucide-react";
import type { FacultyFormCategory, FacultyFormField, FieldType, FacultyVisibleFormSchema } from "@/lib/form-builder-types";

export default function EditTemplateBuilder({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [schema, setSchema] = useState<FacultyVisibleFormSchema | null>(null);
  const [cycleId, setCycleId] = useState("");
  const [version, setVersion] = useState("1");
  const [isActive, setIsActive] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch(`/api/admin/templates/${id}`);
        if (!res.ok) throw new Error("Failed to load template");
        const data = await res.json();
        const template = data.template;
        
        setCycleId(template.cycleId);
        setVersion(template.version.toString());
        setIsActive(template.isActive);
        
        if (template.updatedSchema) {
          setSchema(template.updatedSchema as FacultyVisibleFormSchema);
        } else if (template.schemaJson) {
          setSchema(template.schemaJson as FacultyVisibleFormSchema);
        } else {
          toast.error("Template has no valid schema.");
        }
      } catch (error: any) {
        toast.error("Error loading template", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplate();
  }, [id]);

  const saveTemplate = async () => {
    if (!schema) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: schema.formTitle,
          description: schema.formDescription,
          instructions: schema.instructions,
          schemaJson: schema,
          updatedSchema: schema,
          isActive,
        }),
      });

      if (!res.ok) throw new Error("Failed to update template");
      
      toast.success("Template updated successfully");
      router.push("/admin/templates");
    } catch (error: any) {
      toast.error("Error updating template", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    if (!schema) return;
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
    if (!schema) return;
    const newCategories = [...schema.categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    setSchema({ ...schema, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    if (!schema) return;
    const newCategories = [...schema.categories];
    newCategories.splice(index, 1);
    setSchema({ ...schema, categories: newCategories });
  };

  const addField = (catIndex: number) => {
    if (!schema) return;
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
    if (!schema) return;
    const newCategories = [...schema.categories];
    newCategories[catIndex].fields[fieldIndex] = { ...newCategories[catIndex].fields[fieldIndex], ...updates };
    setSchema({ ...schema, categories: newCategories });
  };

  const removeField = (catIndex: number, fieldIndex: number) => {
    if (!schema) return;
    const newCategories = [...schema.categories];
    newCategories[catIndex].fields.splice(fieldIndex, 1);
    setSchema({ ...schema, categories: newCategories });
  };

  const moveField = (catIndex: number, fieldIndex: number, direction: 'up' | 'down') => {
    if (!schema) return;
    const newCategories = [...schema.categories];
    const fields = newCategories[catIndex].fields;
    if (direction === 'up' && fieldIndex > 0) {
      [fields[fieldIndex - 1], fields[fieldIndex]] = [fields[fieldIndex], fields[fieldIndex - 1]];
    } else if (direction === 'down' && fieldIndex < fields.length - 1) {
      [fields[fieldIndex], fields[fieldIndex + 1]] = [fields[fieldIndex + 1], fields[fieldIndex]];
    }
    setSchema({ ...schema, categories: newCategories });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!schema) {
    return <div className="text-center p-8">Failed to load schema</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Form Template</h1>
          <p className="text-muted-foreground mt-1">
            Modify existing appraisal schema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveTemplate} disabled={isSaving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Update Template"}
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
                <Label>Cycle ID (Read-only)</Label>
                <Input value={cycleId} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-2">
                <Label>Version (Read-only)</Label>
                <Input type="number" value={version} disabled className="bg-gray-100" />
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox id="isActive" checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
                <Label htmlFor="isActive">Active Template</Label>
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
