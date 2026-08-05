import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PROPOSALS_DIR = path.join(process.cwd(), "proposals-pdf");

export async function saveUploadedFile(buffer: Buffer, originalFilename: string): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const safeName = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(UPLOADS_DIR, safeName), buffer);
  return safeName; // relative path, stored on Document.filePath
}

export function uploadsDir(): string {
  return UPLOADS_DIR;
}

export async function saveProposalPdf(buffer: Buffer, proposalId: string): Promise<string> {
  await mkdir(PROPOSALS_DIR, { recursive: true });
  const safeName = `${proposalId}.pdf`;
  await writeFile(path.join(PROPOSALS_DIR, safeName), buffer);
  return safeName;
}

export function proposalsDir(): string {
  return PROPOSALS_DIR;
}
