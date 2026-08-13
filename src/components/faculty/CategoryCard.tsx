"use client";

import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntryCard } from "./EntryCard";
import type { FacultyFormCategory, FacultySubmissionEntry, ValidationIssue } from "@/lib/form-builder-types";
import { v4 as uuidv4 } from "uuid";

interface CategoryCardProps {
  category: FacultyFormCategory;
  isEnabled: boolean;
  entries: FacultySubmissionEntry[];
  validationIssues: ValidationIssue[];
  onToggle: (enabled: boolean) => void;
  onEntriesChange: (entries: FacultySubmissionEntry[]) => void;
  disabled?: boolean;
}

export function CategoryCard({
  category,
  isEnabled,
  entries,
  validationIssues,
  onToggle,
  onEntriesChange,
  disabled = false,
}: CategoryCardProps) {
  const categoryIssues = validationIssues.filter((iss) => iss.categoryKey === category.key && !iss.fieldKey);

  const handleAddEntry = () => {
    onEntriesChange([
      ...entries,
      {
        entryId: uuidv4(),
        categoryKey: category.key,
        values: {},
      },
    ]);
  };

  const handleEntryChange = (entryId: string, updatedValues: Record<string, any>) => {
    onEntriesChange(
      entries.map((e) => (e.entryId === entryId ? { ...e, values: updatedValues } : e))
    );
  };

  const handleRemoveEntry = (entryId: string) => {
    onEntriesChange(entries.filter((e) => e.entryId !== entryId));
  };

  const isCategoryEnabled = isEnabled || !category.canBeEnabledByFaculty;

  return (
    <div className="rounded-2xl border border-[#F3E7DE] bg-[#FFFDF7] shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-6 flex items-start justify-between border-b ${isCategoryEnabled ? "bg-white border-gray-100" : "border-transparent"}`}>
        <div>
          <h3 className="text-xl font-bold text-[#111827]">{category.label}</h3>
          <p className="mt-1 text-sm text-[#6B7280] whitespace-pre-line">{category.description}</p>
          
          {categoryIssues.map((iss, idx) => (
            <p key={idx} className="mt-2 text-sm font-medium text-[#E3120B]">
              {iss.message}
            </p>
          ))}
        </div>
        
        {category.canBeEnabledByFaculty && (
          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border">
            <Switch
              id={`toggle-${category.key}`}
              checked={isEnabled}
              onCheckedChange={onToggle}
              disabled={disabled}
            />
            <Label htmlFor={`toggle-${category.key}`} className="text-sm font-semibold cursor-pointer">
              {isEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        )}
      </div>

      {/* Entries */}
      {isCategoryEnabled && (
        <div className="p-6 bg-gray-50/50 space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No entries added yet.</p>
              <Button onClick={handleAddEntry} className="bg-[#111827] hover:bg-[#374151]" disabled={disabled}>
                <Plus className="mr-2 h-4 w-4" /> Add First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <EntryCard
                  key={entry.entryId}
                  category={category}
                  entry={entry}
                  index={index}
                  totalEntries={entries.length}
                  validationIssues={validationIssues}
                  onChange={(vals) => handleEntryChange(entry.entryId, vals)}
                  onRemove={() => handleRemoveEntry(entry.entryId)}
                  disabled={disabled}
                />
              ))}
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleAddEntry} className="w-full sm:w-auto border-dashed border-2" disabled={disabled}>
                  <Plus className="mr-2 h-4 w-4" /> Add Another Entry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
