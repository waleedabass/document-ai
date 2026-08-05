import { db } from "@/lib/db";

export interface DashboardStats {
  totalDocuments: number;
  needsReview: number;
  exported: number;
  accuracyPct: number | null; // null until at least one document has been reviewed
  reviewedFieldCount: number;
  documents: {
    id: string;
    filename: string;
    vendor: string | null;
    status: string;
    fieldsNeedingReview: number;
    createdAt: Date;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const documents = await db.document.findMany({
    include: { fields: true },
    orderBy: { createdAt: "desc" },
  });

  const reviewed = documents.filter((d) => d.status === "approved" || d.status === "exported");
  const reviewedFields = reviewed.flatMap((d) => d.fields);
  const correctedFields = reviewedFields.filter((f) => f.status === "corrected");
  const accuracyPct = reviewedFields.length > 0 ? ((reviewedFields.length - correctedFields.length) / reviewedFields.length) * 100 : null;

  return {
    totalDocuments: documents.length,
    needsReview: documents.filter((d) => d.status === "needs_review").length,
    exported: documents.filter((d) => d.status === "exported").length,
    accuracyPct,
    reviewedFieldCount: reviewedFields.length,
    documents: documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      vendor: d.fields.find((f) => f.fieldName === "vendor")?.value ?? null,
      status: d.status,
      fieldsNeedingReview: d.fields.filter((f) => f.status === "needs_review").length,
      createdAt: d.createdAt,
    })),
  };
}
