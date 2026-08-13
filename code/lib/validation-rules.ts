import type {
  FacultySubmissionState,
  FacultyVisibleFormSchema,
  ValidationIssue,
} from "./form-builder-types";

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
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
  submission: FacultySubmissionState,
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
        const value = entry.values[field.key];

        if (field.required && isEmptyValue(value)) {
          issues.push({
            categoryKey: category.key,
            entryId: entry.entryId,
            fieldKey: field.key,
            message: `${field.label} is required.`,
          });
        }

        if ((field.type === "url" || field.type === "evidence") && !isEmptyValue(value)) {
          if (typeof value === "string" && !isValidUrl(value)) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `${field.label} must be a valid URL.`,
            });
          }
        }

        if (field.type === "number" && !isEmptyValue(value)) {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `${field.label} must be a number.`,
            });
          }
          if (field.min !== undefined && numericValue < field.min) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `${field.label} cannot be below ${field.min}.`,
            });
          }
          if (field.max !== undefined && numericValue > field.max) {
            issues.push({
              categoryKey: category.key,
              entryId: entry.entryId,
              fieldKey: field.key,
              message: `${field.label} cannot exceed ${field.max}.`,
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
  submission: FacultySubmissionState,
): boolean {
  return validateFacultySubmission(schema, submission).length === 0;
}
