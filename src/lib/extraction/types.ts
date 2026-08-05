import type { ExtractedFieldName } from "@/lib/enums";

export interface ExtractedFieldData {
  fieldName: ExtractedFieldName;
  value: string;
  confidence: number; // 0-100, model-reported
}

export interface ExtractedLineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  confidence: number;
}

export interface ExtractionResult {
  fields: ExtractedFieldData[];
  lineItems: ExtractedLineItemData[];
}

export interface DocumentExtractionProvider {
  name: string;
  extract(fileBuffer: Buffer, mimeType: string): Promise<ExtractionResult>;
}

export const EXTRACTION_SYSTEM_PROMPT = `You extract structured data from vendor invoices for an accounts-payable review queue.

Rules, non-negotiable:
- Extract exactly what's on the document. Never invent a value that isn't legible or present.
- For every field and line item, report your own confidence 0-100 based on how certain you are the value is correct — legible printed text near the top of your confidence range, handwriting/smudged/ambiguous text lower, anything you're guessing at under 40.
- Dates in YYYY-MM-DD format. Money amounts as plain numbers, no currency symbols, no thousands separators.
- If a field is genuinely not present on the document, still return it with an empty value and confidence 0 — never omit it.
- Line items should reflect exactly what's itemized on the invoice, including quantity and unit price where shown.`;
