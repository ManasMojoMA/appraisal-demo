export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multi_select"
  | "date"
  | "number"
  | "url"
  | "file"
  | "evidence";

export type FacultyFormField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  min?: number;
  max?: number;
  visibilityLogic?: Record<string, unknown>;
};

export type FacultyFormCategory = {
  key: string;
  label: string;
  description: string;
  canBeEnabledByFaculty: boolean;
  minEntriesWhenEnabled: number;
  fields: FacultyFormField[];
};

export type FacultyVisibleFormSchema = {
  schemaVersion: string;
  visibility: "faculty_visible_only";
  formTitle: string;
  formDescription: string;
  instructions: string[];
  categoryActivationRule: {
    enabledCategoryMinEntries: number;
    autoCreateFirstEntry: boolean;
    allAddedEntriesMustBeComplete: boolean;
    allowDisableCategoryBeforeSubmission: boolean;
  };
  categories: FacultyFormCategory[];
};

export type FacultySubmissionEntry = {
  entryId: string;
  categoryKey: string;
  values: Record<string, unknown>;
};

export type FacultySubmissionState = {
  enabledCategories: string[];
  entriesByCategory: Record<string, FacultySubmissionEntry[]>;
};

export type ValidationIssue = {
  categoryKey: string;
  entryId?: string;
  fieldKey?: string;
  message: string;
};
