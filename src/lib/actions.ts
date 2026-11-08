"use server";

import { requireLiveAccess } from "@/lib/demo-access";
import { validateFields } from "@/lib/extraction/validation";
import { parseMoney, validateUploads } from "@/lib/input-validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ingestDocument } from "@/lib/extraction/ingest";
import { generateSafeFilename } from "@/lib/storage";
import { getExportProvider } from "@/lib/export";
import { getProposalProvider } from "@/lib/proposals";
import { renderProposalPdf } from "@/lib/proposals/pdf";
import type { ExtractedFieldName } from "@/lib/enums";

export async function uploadDocumentsAction(formData: FormData): Promise<void> {
  await requireLiveAccess();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  validateUploads(files);

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const relativePath = generateSafeFilename(file.name);
    // Sequential on purpose — every provider here has real rate limits
    // (found the hard way across all three of these projects), and a
    // batch upload of several invoices is exactly the kind of burst that
    // trips them.
    await ingestDocument(buffer, file.name, relativePath, file.type || "application/pdf");
  }

  revalidatePath("/");
}

export async function approveAndExportAction(documentId: string, formData: FormData): Promise<void> {
  await requireLiveAccess();
  const fields = await db.extractedField.findMany({ where: { documentId } });

  if (!fields.length) throw new Error("No extracted fields are available to review.");
  const finalValues: Record<string, string> = {};
  for (const field of fields) {
    const submitted = formData.get(field.fieldName);
    const value = typeof submitted === "string" ? submitted.trim() : field.correctedValue ?? field.value;
    if (value.length > 500) throw new Error("Invoice field values must be at most 500 characters.");
    finalValues[field.fieldName] = value;
  }
  const warnings = validateFields(fields.map(field => ({fieldName: field.fieldName as ExtractedFieldName, value: finalValues[field.fieldName], confidence: field.confidence})));
  if (warnings.size) throw new Error("Correct the invoice before export: " + [...warnings.values()].join(" "));
  const get = (name: ExtractedFieldName) => finalValues[name] ?? "";
  // Resolve and validate every amount before recording any approval or corrections.
  const amounts = {subtotal: parseMoney(get("subtotal") || "0"), tax: parseMoney(get("tax") || "0"), total: parseMoney(get("total"))};
  const provider = getExportProvider();
  const result = await provider.exportInvoice({
    vendor: get("vendor"),
    invoiceNumber: get("invoiceNumber"),
    invoiceDate: get("invoiceDate"),
    dueDate: get("dueDate"),
    ...amounts,
  });

  for (const field of fields) {
    if (finalValues[field.fieldName] !== field.value) {
      await db.extractedField.update({where: {id: field.id}, data: {status: "corrected", correctedValue: finalValues[field.fieldName]}});
    }
  }

  await db.exportRecord.create({
    data: { documentId, provider: result.provider, externalId: result.externalId, status: "exported" },
  });
  await db.document.update({ where: { id: documentId }, data: { status: "exported" } });

  revalidatePath("/");
  revalidatePath(`/documents/${documentId}`);
}

export async function generateProposalAction(formData: FormData): Promise<void> {
  await requireLiveAccess();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  if (clientName.length > 150 || brief.length > 20000) throw new Error("Use a client name up to 150 characters and a brief up to 20,000 characters.");
  if (!clientName || !brief) throw new Error("Client name and brief are both required.");

  const provider = getProposalProvider();
  const generated = await provider.generate(clientName, brief);
  const totalPrice = generated.lineItems.reduce((sum, li) => sum + li.price, 0);

  const proposal = await db.proposal.create({
    data: {
      clientName,
      projectTitle: generated.projectTitle,
      inputBrief: brief,
      sections: JSON.stringify(generated.sections),
      lineItems: JSON.stringify(generated.lineItems),
      totalPrice,
      model: provider.name,
    },
  });

  const pdfBuffer = await renderProposalPdf({
    clientName,
    projectTitle: generated.projectTitle,
    sections: generated.sections,
    lineItems: generated.lineItems,
    totalPrice,
  });
  await db.proposal.update({
    where: { id: proposal.id },
    data: { pdfPath: `${proposal.id}.pdf`, pdfData: new Uint8Array(pdfBuffer) },
  });

  revalidatePath("/proposals");
  redirect(`/proposals/${proposal.id}`);
}
