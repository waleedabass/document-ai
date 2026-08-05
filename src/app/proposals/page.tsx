import Link from "next/link";
import { db } from "@/lib/db";
import { generateProposalAction } from "@/lib/actions";
import { timeAgo, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const SAMPLE_BRIEF = `Client runs a 6-location boutique gym chain. Wants a member-facing mobile app for class booking and a churn-prediction dashboard for staff. Currently using spreadsheets and a legacy booking system that double-books classes weekly. Wants to launch before their busy season starts in 10 weeks. Budget mentioned informally as "under $30k to start." Also asked about ongoing support after launch.`;

export default async function ProposalsPage() {
  const proposals = await db.proposal.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Generation lane
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Proposals from a brief, in minutes.</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Paste real sales-call notes or a project brief — nothing here is invented that wasn&apos;t
          in the input.
        </p>
      </div>

      <form action={generateProposalAction} className="panel p-5 flex flex-col gap-3">
        <div>
          <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Client name
          </label>
          <input name="clientName" required placeholder="e.g. Northwind Outdoors" className="field mt-1" />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Brief / call notes
          </label>
          <textarea
            name="brief"
            required
            rows={6}
            defaultValue={SAMPLE_BRIEF}
            className="field mt-1"
          />
        </div>
        <div>
          <button type="submit" className="btn btn-primary">
            Generate proposal →
          </button>
        </div>
      </form>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                <th className="px-5 py-3 font-normal">Proposal</th>
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Total</th>
                <th className="px-5 py-3 font-normal">Created</th>
                <th className="px-5 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
                    No proposals yet — try the sample brief above.
                  </td>
                </tr>
              )}
              {proposals.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-5 py-3.5 font-medium">{p.projectTitle}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--muted)" }}>{p.clientName}</td>
                  <td className="px-5 py-3.5 mono tabular-nums">{formatMoney(p.totalPrice)}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--muted)" }}>{timeAgo(p.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/proposals/${p.id}`} className="btn">
                      View →
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
