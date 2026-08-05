import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadsDir } from "@/lib/storage";

// Serves the original uploaded file so the review queue can show it
// side-by-side with the extracted fields — /uploads is outside public/ on
// purpose (not something you want statically web-servable by filename).
export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]/file">) {
  const { id } = await ctx.params;
  const document = await db.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const bytes = await readFile(path.join(uploadsDir(), document.filePath));
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.filename.replace(/[^a-zA-Z0-9 ._-]/g, "")}"`,
    },
  });
}
