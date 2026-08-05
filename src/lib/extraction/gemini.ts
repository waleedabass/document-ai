import { EXTRACTED_FIELD_NAMES, type ExtractedFieldName } from "@/lib/enums";
import { EXTRACTION_SYSTEM_PROMPT, type DocumentExtractionProvider, type ExtractionResult } from "./types";

// Same v1beta REST surface + camelCase field-naming convention proven
// across the other two ARC projects (generationConfig / responseMimeType /
// responseSchema, inlineData for file input). Retries on transient 429/5xx
// since that's already bitten every Gemini integration built this session.
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [2000, 8000, 20000];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    fields: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          field_name: { type: "STRING", enum: [...EXTRACTED_FIELD_NAMES] },
          value: { type: "STRING" },
          confidence: { type: "INTEGER" },
        },
        required: ["field_name", "value", "confidence"],
      },
    },
    line_items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          quantity: { type: "NUMBER" },
          unit_price: { type: "NUMBER" },
          total: { type: "NUMBER" },
          confidence: { type: "INTEGER" },
        },
        required: ["description", "quantity", "unit_price", "total", "confidence"],
      },
    },
  },
  required: ["fields", "line_items"],
};

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function createGeminiExtractionProvider(apiKey: string): DocumentExtractionProvider {
  return {
    name: "gemini",
    async extract(fileBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
      const base64 = fileBuffer.toString("base64");
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data: base64 } }, { text: "Extract this invoice." }],
          },
        ],
        generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
      });

      let lastError: Error = new Error("unreachable");
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const res = await fetch(`${BASE_URL}/models/${MODEL}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (res.ok) {
          const data = (await res.json()) as GenerateContentResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Gemini returned no content.");
          const parsed = JSON.parse(text) as {
            fields: { field_name: ExtractedFieldName; value: string; confidence: number }[];
            line_items: { description: string; quantity: number; unit_price: number; total: number; confidence: number }[];
          };
          return {
            fields: parsed.fields.map((f) => ({ fieldName: f.field_name, value: f.value, confidence: f.confidence })),
            lineItems: parsed.line_items.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unit_price,
              total: li.total,
              confidence: li.confidence,
            })),
          };
        }

        lastError = new Error(`Gemini generateContent failed: ${res.status} ${await res.text()}`);
        if (!RETRYABLE_STATUS.has(res.status) || attempt === RETRY_DELAYS_MS.length) throw lastError;
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
      throw lastError;
    },
  };
}
