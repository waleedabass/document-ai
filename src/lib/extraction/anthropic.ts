import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTED_FIELD_NAMES, type ExtractedFieldName } from "@/lib/enums";
import { EXTRACTION_SYSTEM_PROMPT, type DocumentExtractionProvider, type ExtractionResult } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const TOOL: Anthropic.Tool = {
  name: "extract_invoice",
  description: "Submit the extracted invoice data.",
  input_schema: {
    type: "object",
    properties: {
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field_name: { type: "string", enum: [...EXTRACTED_FIELD_NAMES] },
            value: { type: "string" },
            confidence: { type: "integer" },
          },
          required: ["field_name", "value", "confidence"],
        },
      },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unit_price: { type: "number" },
            total: { type: "number" },
            confidence: { type: "integer" },
          },
          required: ["description", "quantity", "unit_price", "total", "confidence"],
        },
      },
    },
    required: ["fields", "line_items"],
  } as unknown as Anthropic.Tool.InputSchema,
};

export function createAnthropicExtractionProvider(apiKey: string): DocumentExtractionProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    async extract(fileBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
      const base64 = fileBuffer.toString("base64");
      const documentBlock: Anthropic.ContentBlockParam =
        mimeType === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg", data: base64 } };

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "extract_invoice" },
        messages: [
          {
            role: "user",
            content: [documentBlock, { type: "text", text: "Extract this invoice." }],
          },
        ],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("Claude did not return an extract_invoice tool call.");

      const parsed = toolUse.input as {
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
    },
  };
}
