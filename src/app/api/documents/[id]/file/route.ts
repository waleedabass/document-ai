import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Serves the original uploaded file so the review queue can show it
// side-by-side with the extracted fields — /api/documents/[id]/file is not
// statically web-servable by filename on purpose.
export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]/file">) {
  const { id } = await ctx.params;
  const document = await db.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(document.fileData), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.filename.replace(/[^a-zA-Z0-9 ._-]/g, "")}"`,
    },
  });
}
