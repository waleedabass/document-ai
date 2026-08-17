import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/proposals/[id]/pdf">) {
  const { id } = await ctx.params;
  const proposal = await db.proposal.findUnique({ where: { id } });
  if (!proposal?.pdfData) {
    return NextResponse.json({ error: "Proposal or PDF not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(proposal.pdfData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${proposal.projectTitle.replace(/[^a-zA-Z0-9 ._-]/g, "")}.pdf"`,
    },
  });
}
