import { db } from "@/lib/db";
import { getExtractionProvider } from "./index";
import { validateFields } from "./validation";
import type { ExtractedFieldName } from "@/lib/enums";

export async function ingestDocument(fileBuffer: Buffer, filename: string, filePath: string, mimeType: string): Promise<string> {
  const document = await db.document.create({
    data: { filename, filePath, mimeType, status: "processing" },
  });

  try {
    const provider = getExtractionProvider();
    const result = await provider.extract(fileBuffer, mimeType);
    const warnings = validateFields(result.fields);

    for (const field of result.fields) {
      const warning = warnings.get(field.fieldName as ExtractedFieldName);
      await db.extractedField.create({
        data: {
          documentId: document.id,
          fieldName: field.fieldName,
          value: field.value,
          confidence: field.confidence,
          status: warning || field.confidence < 60 ? "needs_review" : "ok",
          warning,
        },
      });
    }

    for (const li of result.lineItems) {
      await db.lineItem.create({
        data: {
          documentId: document.id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.total,
          confidence: li.confidence,
        },
      });
    }

    await db.document.update({
      where: { id: document.id },
      data: { status: "needs_review", model: provider.name },
    });
  } catch (err) {
    await db.document.update({ where: { id: document.id }, data: { status: "failed" } });
    throw err;
  }

  return document.id;
}
