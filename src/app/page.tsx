import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import { timeAgo } from "@/lib/format";
import UploadDropzone from "@/components/UploadDropzone";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Extraction lane
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Invoices, reviewed honestly.</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Drop in real invoices below — sample messy ones are in{" "}
          <code className="mono">sample-invoices/</code> in the repo.
        </p>
      </div>

      <UploadDropzone />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border" style={{ background: "var(--line)", borderColor: "var(--line)" }}>
        <Stat label="Documents" value={stats.totalDocuments.toLocaleString()} />
        <Stat label="Needs review" value={stats.needsReview.toLocaleString()} />
        <Stat label="Exported" value={stats.exported.toLocaleString()} />
        <Stat
          label="Field accuracy"
          value={stats.accuracyPct === null ? "—" : `${stats.accuracyPct.toFixed(1)}%`}
          note={stats.accuracyPct === null ? "no reviewed documents yet" : `across ${stats.reviewedFieldCount} reviewed fields, uncorrected`}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                <th className="px-5 py-3 font-normal">Document</th>
                <th className="px-5 py-3 font-normal">Vendor</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Flagged fields</th>
                <th className="px-5 py-3 font-normal">Uploaded</th>
                <th className="px-5 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {stats.documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
                    No documents yet. Drop a few sample invoices above to get started.
                  </td>
                </tr>
              )}
              {stats.documents.map((doc) => (
                <tr key={doc.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-5 py-3.5 font-medium">{doc.filename}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--muted)" }}>
                    {doc.vendor || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`chip chip-${doc.status}`}>{doc.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3.5 mono tabular-nums">{doc.fieldsNeedingReview || "—"}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--muted)" }}>
                    {timeAgo(doc.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/documents/${doc.id}`} className="btn">
                      {doc.status === "needs_review" ? "Review →" : "View →"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="p-5 flex flex-col gap-1.5" style={{ background: "var(--panel)" }}>
      <span className="mono text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
        {label}
      </span>
      <span className="mono text-2xl font-semibold tabular-nums">{value}</span>
      {note && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {note}
        </span>
      )}
    </div>
  );
}
