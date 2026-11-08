import { parseMoney } from "../input-validation";
import type { ExtractedFieldName } from "@/lib/enums";
import type { ExtractedFieldData } from "./types";

// Plain-code validation — deliberately independent of the model's own
// confidence score. "The model was confident" and "the math is actually
// right" are different claims; a rule violation forces review regardless
// of how sure the model says it is.
export function validateFields(fields: ExtractedFieldData[]): Map<ExtractedFieldName, string> {
  const byName = new Map(fields.map((f) => [f.fieldName, f.value]));
  const warnings = new Map<ExtractedFieldName, string>();

  const num = (name: ExtractedFieldName): number | null => {
    const v = byName.get(name);
    if (!v) return null;
    try { return parseMoney(v); } catch { return null; }
  };

  for(const name of ['subtotal','tax','total'] as ExtractedFieldName[]) {
    if(byName.get(name)?.trim() && num(name)===null) warnings.set(name, `${name} must be a valid number.`);
  }
  const subtotal = num("subtotal");
  const tax = num("tax");
  const total = num("total");
  if (subtotal !== null && tax !== null && total !== null) {
    if (Math.abs(subtotal + tax - total) > 0.02) {
      warnings.set("total", `Subtotal (${subtotal}) + tax (${tax}) = ${(subtotal + tax).toFixed(2)}, doesn't match total (${total}).`);
    }
  }

  for (const name of ['invoiceDate', 'dueDate'] as ExtractedFieldName[]) {
    const value = byName.get(name)?.trim();
    if (!value) continue;
    const parsed = new Date(value + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) warnings.set(name, `${name} must be a valid date in YYYY-MM-DD format.`);
  }

  const invoiceDate = byName.get("invoiceDate");
  const dueDate = byName.get("dueDate");
  if (invoiceDate && dueDate) {
    const inv = new Date(invoiceDate);
    const due = new Date(dueDate);
    if (!isNaN(inv.getTime()) && !isNaN(due.getTime()) && due < inv) {
      warnings.set("dueDate", `Due date (${dueDate}) is before the invoice date (${invoiceDate}).`);
    }
  }

  const required: ExtractedFieldName[] = ["vendor", "invoiceNumber", "total"];
  for (const name of required) {
    const v = byName.get(name);
    if (!v || v.trim() === "") {
      warnings.set(name, `${name} is required but wasn't found on the document.`);
    }
  }

  return warnings;
}
