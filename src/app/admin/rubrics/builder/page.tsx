"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  key: string;
  label: string;
  maxMarks: number;
  description: string;
}

interface RubricConfig {
  maxTotalMarks: number;
  passingMarks: number;
  categories: Category[];
}

export default function RubricBuilder({ params }: { params?: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rubricId, setRubricId] = useState<string | null>(null);
  
  const [name, setName] = useState("New Grading Rubric");
  const [config, setConfig] = useState<RubricConfig>({
    maxTotalMarks: 100,
    passingMarks: 50,
    categories: [
      { key: "academic_delivery", label: "Academic Delivery", maxMarks: 40, description: "Evaluation based on course delivery, student feedback, and pedagogy." },
      { key: "research_publications", label: "Research & Publications", maxMarks: 30, description: "Evaluation of journal papers, patents, and funded projects." },
      { key: "service_contribution", label: "Service Contribution", maxMarks: 15, description: "Institutional roles and committee memberships." },
      { key: "innovation", label: "Innovation", maxMarks: 15, description: "Innovations in teaching, setups, or systems." },
    ]
  });

  // Unwrap params safely using React.use()
  const resolvedParams = params ? use(params) : null;

  useEffect(() => {
    async function loadRubric() {
      if (!resolvedParams?.id) {
        setLoading(false);
        return;
      }
      
      setRubricId(resolvedParams.id);
      try {
        const res = await fetch(`/api/admin/rubrics/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Failed to fetch rubric");
        const data = await res.json();
        
        setName(data.rubric.name);
        if (data.rubric.configJson) {
          setConfig(data.rubric.configJson);
        }
      } catch (error: any) {
        toast.error("Error", { description: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    loadRubric();
  }, [resolvedParams?.id]);

  // Recalculate total marks when categories change
  useEffect(() => {
    const total = config.categories.reduce((acc, cat) => acc + (Number(cat.maxMarks) || 0), 0);
    if (total !== config.maxTotalMarks) {
      setConfig(prev => ({ ...prev, maxTotalMarks: total }));
    }
  }, [config.categories]);

  const addCategory = () => {
    setConfig({
      ...config,
      categories: [
        ...config.categories,
        { key: `category_${Date.now()}`, label: "New Category", maxMarks: 10, description: "" }
      ]
    });
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const newCategories = [...config.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    // Auto-generate key from label if it's a new category and key wasn't explicitly set
    if (field === "label" && newCategories[index].key.startsWith("category_")) {
        newCategories[index].key = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }
    setConfig({ ...config, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    const newCategories = [...config.categories];
    newCategories.splice(index, 1);
    setConfig({ ...config, categories: newCategories });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a rubric name");
      return;
    }
    if (config.categories.length === 0) {
      toast.error("Please add at least one category");
      return;
    }

    setSaving(true);
    try {
      if (rubricId) {
        // Update existing (Need to implement PUT if needed, but for now we might just create new versions)
        // Wait, templates builder uses PUT. I should create a PUT route.
        const res = await fetch(`/api/admin/rubrics/${rubricId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, configJson: config }),
        });
        if (!res.ok) throw new Error("Failed to update rubric");
        toast.success("Rubric updated successfully");
      } else {
        // Create new
        const res = await fetch("/api/admin/rubrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId: "base-cycle", // Draft rubrics go to base-cycle
            version: 1,
            name,
            configJson: config,
            isActive: false,
          }),
        });
        if (!res.ok) throw new Error("Failed to create rubric");
        const data = await res.json();
        toast.success("Rubric created successfully");
        router.push(`/admin/rubrics/builder/${data.rubric.id}`);
      }
    } catch (error: any) {
      toast.error("Error saving rubric", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/admin/rubrics" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <div className="flex-1">
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="text-2xl font-bold border-none bg-transparent shadow-none px-0 h-auto focus-visible:ring-0"
            placeholder="Rubric Name"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Rubric
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {config.categories.map((category, idx) => (
            <Card key={idx} className="border-t-4 border-t-indigo-500">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Category {idx + 1}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => removeCategory(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label>Category Label</Label>
                    <Input value={category.label} onChange={(e) => updateCategory(idx, "label", e.target.value)} placeholder="e.g. Teaching & Academic Delivery" />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Max Marks</Label>
                    <Input type="number" min="0" value={category.maxMarks} onChange={(e) => updateCategory(idx, "maxMarks", parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Evaluation Description / Criteria</Label>
                  <Textarea 
                    value={category.description} 
                    onChange={(e) => updateCategory(idx, "description", e.target.value)} 
                    placeholder="Provide instructions to evaluators on how to score this category..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">System Key (Auto-generated)</Label>
                  <Input value={category.key} onChange={(e) => updateCategory(idx, "key", e.target.value)} className="h-8 text-xs bg-slate-50 font-mono" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addCategory} className="w-full border-dashed border-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Grading Category
          </Button>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Rubric Settings</CardTitle>
              <CardDescription>Overall scoring rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Total Maximum Marks</Label>
                <div className="text-4xl font-bold text-indigo-600">
                  {config.maxTotalMarks}
                </div>
                <p className="text-xs text-slate-500">Auto-calculated from categories.</p>
              </div>
              <div className="space-y-2">
                <Label>Minimum Passing Marks</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max={config.maxTotalMarks} 
                  value={config.passingMarks} 
                  onChange={(e) => setConfig({...config, passingMarks: parseInt(e.target.value) || 0})} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
