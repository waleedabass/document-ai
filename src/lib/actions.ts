"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ingestDocument } from "@/lib/extraction/ingest";
import { saveUploadedFile, saveProposalPdf } from "@/lib/storage";
import { getExportProvider } from "@/lib/export";
import { getProposalProvider } from "@/lib/proposals";
import { renderProposalPdf } from "@/lib/proposals/pdf";
import type { ExtractedFieldName } from "@/lib/enums";

export async function uploadDocumentsAction(formData: FormData): Promise<void> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const relativePath = await saveUploadedFile(buffer, file.name);
    // Sequential on purpose — every provider here has real rate limits
    // (found the hard way across all three of these projects), and a
    // batch upload of several invoices is exactly the kind of burst that
    // trips them.
    await ingestDocument(buffer, file.name, relativePath, file.type || "application/pdf");
  }

  revalidatePath("/");
}

export async function approveAndExportAction(documentId: string, formData: FormData): Promise<void> {
  const fields = await db.extractedField.findMany({ where: { documentId } });

  const finalValues: Record<string, string> = {};
  for (const field of fields) {
    const submitted = formData.get(field.fieldName);
    const newValue = typeof submitted === "string" ? submitted : field.value;
    finalValues[field.fieldName] = newValue;

    if (newValue !== field.value) {
      await db.extractedField.update({
        where: { id: field.id },
        data: { status: "corrected", correctedValue: newValue },
      });
    }
  }

  await db.document.update({ where: { id: documentId }, data: { status: "approved" } });

  const provider = getExportProvider();
  const get = (name: ExtractedFieldName) => finalValues[name] ?? "";
  const result = await provider.exportInvoice({
    vendor: get("vendor"),
    invoiceNumber: get("invoiceNumber"),
    invoiceDate: get("invoiceDate"),
    dueDate: get("dueDate"),
    subtotal: parseFloat(get("subtotal")) || 0,
    tax: parseFloat(get("tax")) || 0,
    total: parseFloat(get("total")) || 0,
  });

  await db.exportRecord.create({
    data: { documentId, provider: result.provider, externalId: result.externalId, status: "exported" },
  });
  await db.document.update({ where: { id: documentId }, data: { status: "exported" } });

  revalidatePath("/");
  revalidatePath(`/documents/${documentId}`);
}

export async function generateProposalAction(formData: FormData): Promise<void> {
  const clientName = String(formData.get("clientName") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
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
  const pdfPath = await saveProposalPdf(pdfBuffer, proposal.id);
  await db.proposal.update({ where: { id: proposal.id }, data: { pdfPath } });

  revalidatePath("/proposals");
  redirect(`/proposals/${proposal.id}`);
}
