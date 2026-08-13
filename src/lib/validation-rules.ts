import type {
  FacultySubmissionState,
  FacultyVisibleFormSchema,
  ValidationIssue,
} from "./form-builder-types";

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          if (parsed.type === "link") return !parsed.linkUrl || parsed.linkUrl.trim().length === 0;
          if (parsed.type === "upload") return !parsed.uploadedFiles || parsed.uploadedFiles.length === 0;
        }
      } catch {}
    }
    return false;
  }
  if (typeof value === "object") {
    const val = value as any;
    if (val.type === "link") return !val.linkUrl || val.linkUrl.trim().length === 0;
    if (val.type === "upload") return !val.uploadedFiles || val.uploadedFiles.length === 0;
    if (Array.isArray(value)) return value.length === 0;
  }
  return false;
}

function isValidUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateFacultySubmission(
  schema: FacultyVisibleFormSchema,
  submission: FacultySubmissionState
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const category of schema.categories) {
    const isEnabled = submission.enabledCategories.includes(category.key);
    const entries = submission.entriesByCategory[category.key] ?? [];

    if (!isEnabled) continue;

    if (entries.length < category.minEntriesWhenEnabled) {
      issues.push({
        categoryKey: category.key,
        message: `${category.label} is enabled. Please complete at least one entry or disable this category.`,
      });
      continue;
    }

    for (const entry of entries) {
      for (const field of category.fields) {
        if (field.visibilityLogic) {
          let isVisible = true;
          for (const [vKey, vVal] of Object.entries(field.visibilityLogic)) {
            if (entry.values[vKey] !== vVal) {
              isVisible = false;
              break;
            }
          }
          if (!isVisible) continue; // Skip validation for hidden fields
        }

        const value = entry.values[field.key];

        if (field.required && isEmptyValue(value)) {
          issues.push({
            categoryKey: category.key,
            entryId: entry.entryId,
            fieldKey: field.key,
            message: "This field is required.",
          });
        }

        if (field.type === "url" && !isEmptyValue(value)) {
          if (typeof value === "string" && !isValidUrl(value)) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: "Please enter a valid URL starting with http:// or https://",
            });
          }
        }

        if (field.type === "evidence" && !isEmptyValue(value)) {
          let parsedVal: any = value;
          if (typeof value === "string") {
            try {
              parsedVal = JSON.parse(value);
            } catch {
              parsedVal = { type: "link", linkUrl: value };
            }
          }
          if (parsedVal && typeof parsedVal === "object") {
            if (parsedVal.type === "link" && !isValidUrl(parsedVal.linkUrl)) {
              issues.push({
                categoryKey: category.key,
                entryId: entry.entryId,
                fieldKey: field.key,
                message: "Please enter a valid URL starting with http:// or https://",
              });
            }
          }
        }

        if (field.type === "number" && !isEmptyValue(value)) {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: "Please enter a valid number.",
            });
          }
          if (field.min !== undefined && numericValue < field.min) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `Value cannot be less than ${field.min}.`,
            });
          }
          if (field.max !== undefined && numericValue > field.max) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `Value cannot exceed ${field.max}.`,
            });
          }
        }
      }
    }
  }

  return issues;
}

export function canSubmitFacultyForm(
  schema: FacultyVisibleFormSchema,
  submission: FacultySubmissionState
): boolean {
  return validateFacultySubmission(schema, submission).length === 0;
}
