// SQLite has no native enum type, so the schema stores these as String.
// Single source of truth for allowed values.

export const DOCUMENT_STATUSES = ["processing", "needs_review", "approved", "exported", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const FIELD_STATUSES = ["ok", "needs_review", "corrected"] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

export const EXTRACTED_FIELD_NAMES = [
  "vendor",
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "subtotal",
  "tax",
  "total",
] as const;
export type ExtractedFieldName = (typeof EXTRACTED_FIELD_NAMES)[number];

export const FIELD_LABEL: Record<ExtractedFieldName, string> = {
  vendor: "Vendor",
  invoiceNumber: "Invoice #",
  invoiceDate: "Invoice date",
  dueDate: "Due date",
  subtotal: "Subtotal",
  tax: "Tax",
  total: "Total",
};

// Confidence tiers for the review-queue UI — green/amber/red.
export function confidenceTier(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 85) return "high";
  if (confidence >= 60) return "medium";
  return "low";
}
