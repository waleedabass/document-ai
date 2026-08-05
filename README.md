# Back-Office Document AI

A working prototype of ARC Automations' invoice extraction + proposal generation product — the "quiet money-maker" per the brief. Two lanes, both real:

- **Extraction**: drop in a real invoice PDF/image → AI reads it with native vision (no separate OCR step) → structured fields with per-field confidence → plain-code validation rules that catch real invoice math errors independent of how confident the model felt → human review queue with color-coded fields → approve → export.
- **Generation**: paste a real sales-call brief → AI produces a structured, priced proposal grounded only in what was actually said → rendered into a real branded PDF via `pdf-lib`.

Nothing here is a mock. Every extraction is a real vision-model call against a real document; every proposal PDF is a real file you can open.

## What's real right now, with zero paid accounts (beyond an AI key)

- **6 genuinely messy sample invoices** in `sample-invoices/` (`generate.py`), not uniform fixtures — different vendors, layouts, and formatting quality, including **one with a real math error baked into the printed numbers** (subtotal + tax ≠ the printed total) specifically to prove the validation rule catches a real invoice mistake, not just an OCR slip. Verified live: the extraction correctly reads the wrong printed total exactly as printed, and the validation rule flags it — the two are deliberately kept separate.
- **The review queue** — confidence-colored fields (green ≥85 / accent 60-84 / muted <60), inline correction, and an honest accuracy metric on the dashboard ("X% of fields left uncorrected across reviewed documents") that's genuinely zero until documents have actually been reviewed.
- **Side-by-side source and extraction** (`/documents/[id]`) — the original uploaded PDF/image renders next to the extracted fields via `/api/documents/[id]/file`, so a reviewer can actually check a number against the source instead of trusting it blind. Verified live: the file route returns the real bytes, and the iframe renders it at a real, usable size.
- **The proposal generator** — verified live end-to-end: a real gym-chain brief in, a real 4-section proposal with correctly-priced line items out (stayed under the mentioned budget on its own), downloaded as an actual PDF and visually confirmed to render correctly.

## The same real constraint as the other two ARC projects

Gemini's free tier caps at 20 requests/day per model; OpenRouter's free `:free` models cap at 50/day. Extraction specifically needs Claude or Gemini (vision) — OpenRouter's free models aren't reliable for document vision, so it's only in the fallback chain for the (text-only) proposal lane. See the other two projects' READMEs for the full story on why these limits matter and how `AI_PROVIDER` auto-detection works.

## What needs a key from you, in the order to get them

| Stage | Provider | Cost to start | Env var |
|---|---|---|---|
| Extraction (vision, required) | [Anthropic](https://console.anthropic.com) or [Google AI Studio](https://aistudio.google.com/apikey) | Anthropic: pay-as-you-go. Gemini: free tier. | `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` |
| Proposal generation (text, required) | Either of the above, or [OpenRouter](https://openrouter.ai/keys) | Same as above, or OpenRouter's free tier | Same, or `OPENROUTER_API_KEY` |
| Accounting export | Real QuickBooks/Xero integration | Not built yet — see below | — |

Copy `.env.example` to `.env` and fill in what you have.

## Running it

```bash
npm install
python sample-invoices/generate.py   # regenerate the sample invoices if needed (reportlab required)
npm run dev
```

Then:

1. **`/`** — drop a few files from `sample-invoices/` onto the dropzone (or click to browse). Watch them land in the table, then click "Review" on one.
2. **`/documents/[id]`** — the review queue. The Ridgeline Logistics sample will show a validation warning on the Total field even though the model was confident — that's the point. Correct it, hit Approve & export, then check the dashboard's accuracy metric updated.
3. **`/proposals`** — a real sample brief is pre-filled; add a client name and generate. Download the resulting PDF from the detail page.

## Architecture notes

- **Same conventions as the other two ARC projects**: Next.js 16 + Prisma 7 with the `@prisma/adapter-better-sqlite3` driver adapter, Server Actions for mutations, provider interfaces (`DocumentExtractionProvider`, `ProposalProvider`, `ExportProvider`) so a real accounting integration slots in without touching business logic. Same 8-color minimal palette across all three, for a portfolio that reads as one body of work.
- **No separate OCR service.** Claude and Gemini both accept PDF/image input natively and return structured JSON directly — genuinely simpler and more accurate than a classic OCR-then-parse pipeline.
- **Validation rules run in plain TypeScript, not AI** (`src/lib/extraction/validation.ts`): subtotal + tax ≈ total (rounding-tolerant), due date ≥ invoice date, required fields present. A rule violation forces `needs_review` regardless of the model's own confidence score — those are different claims, and conflating them is exactly how an "average" implementation fools itself into shipping something that looks trustworthy but isn't.
- **Files stored on local disk** (`/uploads`, `/proposals-pdf`, both gitignored), path referenced in the DB — no S3 dependency needed at prototype scale.
- **PDF generation is `pdf-lib`**, not a headless browser — pure JS, no Puppeteer/Playwright dependency, works fine in a serverless-friendly Next.js deployment. Manual text-wrapping and page-break handling (`src/lib/proposals/pdf.ts`) since `pdf-lib` doesn't do layout for you, but that's a small, fully-owned piece of code instead of a heavy rendering dependency.
- **Real QuickBooks/Xero export is deliberately not built.** Both require registering an OAuth app (a real setup step, not just pasting an API key like every other integration across these three ARC projects) — `src/lib/export/logOnly.ts` is the default, and a real provider slots in behind the same `ExportProvider` interface once that registration exists.

## Known limitations, on purpose

- Confidence scores are model-reported, not independently calibrated — treat them as "how sure the model says it is," which is exactly why the plain-code validation rules exist as a second, independent check rather than trusting confidence alone.
- Line items don't get their own confidence-driven review UI yet (only top-level fields do) — they're shown read-only in the review queue. A client build would extend the same color-coding to line items.
- Proposal line-item pricing is the model's own judgment call grounded in the brief, not pulled from a real rate card — a client deployment would want to ground pricing against actual service rates, not just "realistic B2B agency pricing" as prompted here.
