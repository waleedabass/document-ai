# Back-Office Document AI — Pitch Guide & Productionization Kit

Repo: https://github.com/waleedabass/document-ai

---

## 1. Production-Conversion Prompt

```
I'm taking the document-ai prototype to production for a real client.
Read AGENTS.md, CLAUDE.md, and README.md first, then do the following:

CLIENT CONTEXT
- Client: [CLIENT_NAME], processing [DOCUMENT_VOLUME] invoices/month from
  [NUMBER] vendors, and generating [PROPOSAL_VOLUME] proposals/month
- Accounting system of record: [QUICKBOOKS / XERO / NETSUITE / OTHER]
- Who reviews extracted documents day-to-day: [CLIENT_AP_TEAM_ROLE]

EXTRACTION
- The extraction schema (src/lib/enums.ts EXTRACTED_FIELD_NAMES) is
  generic invoice fields — confirm it covers every field [CLIENT_NAME]
  actually needs (PO numbers, cost-center codes, approval routing fields,
  etc.) and extend the schema + prompts in src/lib/extraction/ if not.
- Re-validate extraction accuracy against a real sample of [CLIENT_NAME]'s
  actual vendor invoice formats (different vendors format very
  differently) — don't assume the generic prompt generalizes without
  testing on their real documents.

VALIDATION RULES
- Review src/lib/extraction/validation.ts — add any client-specific
  business rules (e.g. PO-number-must-exist-in-system, amount-must-match-
  approved-PO, vendor-must-be-in-approved-vendor-list).

ACCOUNTING EXPORT (the real gap to close)
- Register a real OAuth app with [QUICKBOOKS/XERO/NETSUITE] — this is the
  one integration deliberately left log-only in the prototype because it
  needs a registered, reviewed app, not just an API key.
- Implement the real ExportProvider once the app is approved, mapping
  approved documents into the client's real chart of accounts.

DATA LAYER
- Replace SQLite with Postgres — [CONNECTION_STRING].
- Replace local disk storage (/uploads, /proposals-pdf) with real object
  storage (S3/R2/GCS) for production durability and multi-instance
  deployment — [STORAGE_BUCKET].

PROPOSAL GENERATION
- Replace the "realistic B2B agency pricing" prompt guidance with
  [CLIENT_NAME]'s actual rate card / service catalog, so generated
  proposals price against real numbers, not the model's own judgment.
- Apply [CLIENT_NAME]'s real proposal branding/template in
  src/lib/proposals/pdf.ts.

DEPLOYMENT
- Deploy to [VERCEL/CLIENT_INFRA], custom domain, environment variables
  from Section 2.
- Add authentication + role-based access (AP reviewers vs. approvers vs.
  admins) — the prototype has none.

Test end-to-end with 10-20 of the client's real invoices (different
vendors/formats) and one real proposal brief before handoff.
```

---

## 2. Client Details Needed

**Brand & identity**
- Company name, logo, brand colors for the review-queue UI and generated proposal PDFs

**Document volume & sources**
- Real sample invoices (at least 10-20, spanning their different vendor formats) for extraction testing
- Monthly volume of invoices and proposals, for capacity/cost planning

**Accounting system**
- Which platform (QuickBooks/Xero/NetSuite/other), and who owns getting the OAuth app registered/approved on their end
- Their chart of accounts / GL codes so extracted line items map correctly

**Extraction requirements**
- Full list of fields they need captured beyond the generic set (PO numbers, cost centers, approval routing, tax jurisdictions, etc.)
- Any hard validation rules specific to their AP process (e.g. must match an open PO)

**Proposals**
- Their real rate card / service pricing
- Their branded proposal template (logo, colors, standard terms/sections)

**Review workflow**
- Who reviews extracted documents day to day, and whether there's a multi-step approval chain (reviewer → approver) vs. single-step
- What "approved" should trigger downstream (export to accounting, notify someone, etc.)

**Access & auth**
- Team roster and role assignments (reviewer/approver/admin), preferred auth method

**Infra**
- Hosting preference, object storage account (S3/R2/GCS) for documents and generated PDFs, database

---

## 3. Pitch Guide — Everything This Product Does

### The problem it solves

Accounts-payable teams spend hours a week manually keying invoice data into their accounting system, and a lot of that manual entry contains real errors that go uncaught — a total that doesn't match subtotal plus tax, a due date before the invoice date. On the other side, sales teams write proposals from scratch every time, which is slow and inconsistent.

### The pitch, feature by feature

**1. Real vision-based extraction — no separate OCR step**
The system reads invoices directly with a vision-capable AI model — no brittle, separate OCR pipeline that garbles unusual layouts. It works on the messy reality of vendor invoices: different formats, different quality scans, different layouts.

**2. Per-field confidence, not a black-box score**
Every extracted field comes with the model's own confidence, color-coded in the review queue (green/amber/red) so a reviewer's eye goes straight to what actually needs checking instead of re-verifying everything from scratch.

**3. Independent math validation — catches real errors, not just OCR slips**
Separately from the AI's confidence, plain business-rule code checks whether the numbers actually add up (subtotal + tax = total) and whether dates make sense. This catches genuine invoice mistakes even when the model read the (wrong) printed numbers perfectly and felt totally confident about it — confidence and correctness are different claims, and this system checks both.

**4. Side-by-side review — verify against the actual source**
The original document sits right next to the extracted fields, so a reviewer can check a number against the real invoice image in seconds, not by trusting the extraction blindly or hunting for a separate file.

**5. One-click approve — then it's ready for accounting**
Once verified, a document moves to "approved" and is ready to export into the accounting system, with a full audit trail of who approved what and when.

**6. AI-drafted proposals, priced and structured**
From a plain-language brief of a sales call, the system generates a structured, correctly-priced, real PDF proposal — grounded only in what was actually discussed, not invented client needs.

### Why this is agency-grade, not "average"

An average document-processing tool trusts whatever confidence score the model reports and calls it done. This system treats "the model is confident" and "the math is actually correct" as two separate, independently-checked facts — which is exactly the discipline a careful human AP clerk applies, just automated and consistent every single time.

### Recurring revenue angle

- Per-document processing fee or monthly volume tier
- Accounting-system integration fee (QuickBooks/Xero/NetSuite connector setup)
- Proposal-generation add-on, priced per proposal or as a flat monthly add-on
- Upsell: payment reconciliation, multi-entity/multi-currency support, approval-chain workflows for larger AP teams

### Suggested live demo script

1. Drop in a real, messy invoice — show the extraction landing with confidence colors.
2. Show the one invoice with a deliberate math error — extraction reads it confidently, but the validation rule flags it anyway. This is the single best "average vs. agency" moment in the whole demo.
3. Approve a clean one and show it ready for export.
4. Paste a real sales-call brief and generate a proposal — download the actual PDF.
