import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { approveAndExportAction } from "@/lib/actions";
import { FIELD_LABEL, confidenceTier, type ExtractedFieldName } from "@/lib/enums";
import { formatMoney, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    include: { fields: true, lineItems: true, exports: true },
  });
  if (!doc) notFound();

  const fieldOrder: ExtractedFieldName[] = ["vendor", "invoiceNumber", "invoiceDate", "dueDate", "subtotal", "tax", "total"];
  const fieldsByName = new Map(doc.fields.map((f) => [f.fieldName as ExtractedFieldName, f]));
  const isFinal = doc.status === "approved" || doc.status === "exported";
  const fileUrl = `/api/documents/${doc.id}/file`;
  const isPdf = doc.mimeType === "application/pdf";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Review queue
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{doc.filename}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Extracted by {doc.model ?? "—"} · uploaded {timeAgo(doc.createdAt)}
          </p>
        </div>
        <span className={`chip chip-${doc.status}`}>{doc.status.replace("_", " ")}</span>
      </div>

      {/* Side-by-side source + extraction — the trust-building pattern the
          brief calls out explicitly. Never ask a reviewer to trust
          extracted numbers they can't check against the original. */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="panel overflow-hidden lg:sticky lg:top-20" style={{ height: "80vh" }}>
          {isPdf ? (
            <iframe src={fileUrl} title={`Source: ${doc.filename}`} className="w-full h-full" style={{ border: "none" }} />
          ) : (
            <div className="w-full h-full overflow-auto flex items-start justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={`Source: ${doc.filename}`} className="max-w-full" />
            </div>
          )}
        </div>

        <form action={approveAndExportAction.bind(null, doc.id)} className="flex flex-col gap-6">
          <div className="panel p-5">
            <h2 className="text-sm font-semibold mb-1">Fields</h2>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Colored bar shows the model&apos;s own confidence. A validation warning forces review
              regardless of confidence — the math has to actually be right, not just look right.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {fieldOrder.map((name) => {
                const field = fieldsByName.get(name);
                if (!field) return null;
                const tier = confidenceTier(field.confidence);
                return (
                  <div key={name} className="conf-field rounded-lg pl-3 py-1.5" data-tier={tier}>
                    <div className="flex items-center justify-between">
                      <label className="mono text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                        {FIELD_LABEL[name]}
                      </label>
                      <span className="mono text-[10px] tabular-nums" style={{ color: "var(--muted-2)" }}>
                        {field.confidence}%
                      </span>
                    </div>
                    <input
                      name={name}
                      defaultValue={field.correctedValue ?? field.value}
                      disabled={isFinal}
                      className="field mt-1"
                    />
                    {field.warning && (
                      <p className="text-xs mt-1" style={{ color: "var(--text)" }}>
                        ⚠ {field.warning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {doc.lineItems.length > 0 && (
            <div className="panel p-5">
              <h2 className="text-sm font-semibold mb-4">Line items</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                    <th className="pb-2 font-normal">Description</th>
                    <th className="pb-2 font-normal">Qty</th>
                    <th className="pb-2 font-normal">Unit price</th>
                    <th className="pb-2 font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lineItems.map((li) => (
                    <tr key={li.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                      <td className="py-2">{li.description}</td>
                      <td className="py-2 mono tabular-nums">{li.quantity}</td>
                      <td className="py-2 mono tabular-nums">{formatMoney(li.unitPrice)}</td>
                      <td className="py-2 mono tabular-nums">{formatMoney(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isFinal && (
            <div>
              <button type="submit" className="btn btn-primary">
                ✓ Approve &amp; export
              </button>
            </div>
          )}

          {doc.exports.length > 0 && (
            <div className="text-xs mono" style={{ color: "var(--muted)" }}>
              Exported via {doc.exports[0].provider} · {timeAgo(doc.exports[0].createdAt)}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
