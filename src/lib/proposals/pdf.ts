import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { GeneratedProposal } from "./types";

const PAGE_SIZE: [number, number] = [612, 792]; // US Letter, points
const MARGIN = 56;
const INK = rgb(0.071, 0.075, 0.078); // #121314
const MUTED = rgb(0.243, 0.259, 0.275); // #3e4246
const LINE = rgb(0.776, 0.780, 0.784); // #c6c7c8

interface Cursor {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
}

function newPage(cursor: Pick<Cursor, "doc" | "font" | "bold">): Cursor {
  const page = cursor.doc.addPage(PAGE_SIZE);
  return { ...cursor, page, y: PAGE_SIZE[1] - MARGIN };
}

function ensureSpace(cursor: Cursor, needed: number): Cursor {
  if (cursor.y - needed < MARGIN) return newPage(cursor);
  return cursor;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = (line + " " + word).trim();
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(cursor: Cursor, text: string, opts: { size: number; font: PDFFont; color: typeof INK; maxWidth: number; lineGap?: number }): Cursor {
  let c = cursor;
  const lines = wrapText(text, opts.font, opts.size, opts.maxWidth);
  for (const line of lines) {
    c = ensureSpace(c, opts.size + (opts.lineGap ?? 4));
    c.page.drawText(line, { x: MARGIN, y: c.y, size: opts.size, font: opts.font, color: opts.color });
    c = { ...c, y: c.y - opts.size - (opts.lineGap ?? 4) };
  }
  return c;
}

export async function renderProposalPdf(input: {
  clientName: string;
  projectTitle: string;
  sections: { heading: string; body: string }[];
  lineItems: { description: string; price: number }[];
  totalPrice: number;
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let cursor = newPage({ doc, font, bold });
  const contentWidth = PAGE_SIZE[0] - MARGIN * 2;

  // Header / brand
  cursor.page.drawText("ARC AUTOMATIONS", { x: MARGIN, y: cursor.y, size: 10, font: bold, color: MUTED });
  cursor = { ...cursor, y: cursor.y - 28 };
  cursor = drawParagraph(cursor, input.projectTitle, { size: 22, font: bold, color: INK, maxWidth: contentWidth, lineGap: 6 });
  cursor = { ...cursor, y: cursor.y - 2 };
  cursor.page.drawText(`Prepared for ${input.clientName}`, { x: MARGIN, y: cursor.y, size: 11, font: italic, color: MUTED });
  cursor = { ...cursor, y: cursor.y - 10 };
  cursor.page.drawLine({ start: { x: MARGIN, y: cursor.y }, end: { x: PAGE_SIZE[0] - MARGIN, y: cursor.y }, thickness: 1, color: LINE });
  cursor = { ...cursor, y: cursor.y - 26 };

  // Sections
  for (const section of input.sections) {
    cursor = ensureSpace(cursor, 40);
    cursor.page.drawText(section.heading, { x: MARGIN, y: cursor.y, size: 13, font: bold, color: INK });
    cursor = { ...cursor, y: cursor.y - 20 };
    cursor = drawParagraph(cursor, section.body, { size: 10.5, font, color: INK, maxWidth: contentWidth, lineGap: 5 });
    cursor = { ...cursor, y: cursor.y - 18 };
  }

  // Pricing table
  cursor = ensureSpace(cursor, 40 + input.lineItems.length * 20);
  cursor.page.drawText("Investment", { x: MARGIN, y: cursor.y, size: 13, font: bold, color: INK });
  cursor = { ...cursor, y: cursor.y - 22 };
  for (const item of input.lineItems) {
    cursor = ensureSpace(cursor, 20);
    cursor.page.drawText(item.description, { x: MARGIN, y: cursor.y, size: 10.5, font, color: INK });
    const priceText = `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    cursor.page.drawText(priceText, {
      x: PAGE_SIZE[0] - MARGIN - font.widthOfTextAtSize(priceText, 10.5),
      y: cursor.y,
      size: 10.5,
      font,
      color: MUTED,
    });
    cursor = { ...cursor, y: cursor.y - 19 };
  }
  cursor = { ...cursor, y: cursor.y - 4 };
  cursor.page.drawLine({ start: { x: MARGIN, y: cursor.y }, end: { x: PAGE_SIZE[0] - MARGIN, y: cursor.y }, thickness: 1, color: LINE });
  cursor = { ...cursor, y: cursor.y - 20 };
  cursor.page.drawText("Total", { x: MARGIN, y: cursor.y, size: 12, font: bold, color: INK });
  const totalText = `$${input.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  cursor.page.drawText(totalText, {
    x: PAGE_SIZE[0] - MARGIN - bold.widthOfTextAtSize(totalText, 12),
    y: cursor.y,
    size: 12,
    font: bold,
    color: INK,
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
