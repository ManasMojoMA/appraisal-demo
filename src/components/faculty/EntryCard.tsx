"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicField } from "./DynamicField";
import type { FacultyFormCategory, FacultySubmissionEntry, ValidationIssue } from "@/lib/form-builder-types";

interface EntryCardProps {
  category: FacultyFormCategory;
  entry: FacultySubmissionEntry;
  index: number;
  totalEntries: number;
  validationIssues: ValidationIssue[];
  onChange: (updatedValues: Record<string, any>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function EntryCard({
  category,
  entry,
  index,
  totalEntries,
  validationIssues,
  onChange,
  onRemove,
  disabled = false,
}: EntryCardProps) {
  const canRemove = totalEntries > category.minEntriesWhenEnabled;

  const handleFieldChange = (fieldKey: string, value: any) => {
    onChange({
      ...entry.values,
      [fieldKey]: value,
    });
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <h4 className="text-lg font-semibold text-[#111827]">
          {category.label} - Entry #{index + 1}
        </h4>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-gray-400 hover:text-[#E3120B] hover:bg-red-50"
            disabled={disabled}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Entry
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {category.fields.map((field) => {
          // Find if this field has a validation issue
          const issue = validationIssues.find(
            (iss) => iss.entryId === entry.entryId && iss.fieldKey === field.key
          );

          // Support basic visibility logic (e.g. show if another field matches value)
          if (field.visibilityLogic) {
            let isVisible = true;
            for (const [vKey, vVal] of Object.entries(field.visibilityLogic)) {
              if (entry.values[vKey] !== vVal) {
                isVisible = false;
                break;
              }
            }
            if (!isVisible) return null;
          }

          // Dynamic label replacement (e.g. "Title of the {{type}}")
          const dynamicField = { ...field };
          if (dynamicField.label.includes("{{")) {
            dynamicField.label = dynamicField.label.replace(/\{\{(\w+)\}\}/g, (_, k) => {
              const val = entry.values[k];
              return val ? String(val) : `[${k}]`;
            });
          }

          return (
            <div
              key={field.key}
              className={
                field.type === "textarea" || field.type === "evidence" || field.type === "multi_select"
                  ? "sm:col-span-2"
                  : ""
              }
            >
              <DynamicField
                field={dynamicField}
                value={entry.values[field.key]}
                onChange={(val) => handleFieldChange(field.key, val)}
                error={issue?.message}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
