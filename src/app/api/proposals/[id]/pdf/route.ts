import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposalsDir } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/proposals/[id]/pdf">) {
  const { id } = await ctx.params;
  const proposal = await db.proposal.findUnique({ where: { id } });
  if (!proposal?.pdfPath) {
    return NextResponse.json({ error: "Proposal or PDF not found" }, { status: 404 });
  }

  const bytes = await readFile(path.join(proposalsDir(), proposal.pdfPath));
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${proposal.projectTitle.replace(/[^a-zA-Z0-9 ._-]/g, "")}.pdf"`,
    },
  });
}
