import type { ExportInput, ExportProvider, ExportResult } from "./types";

// Default until a real QuickBooks/Xero OAuth integration is registered —
// both require a registered OAuth app (not just an API key like every
// other integration across these three projects), so that's real setup
// work deferred rather than half-built. Logs what would have been synced.
export const logOnlyExportProvider: ExportProvider = {
  name: "log_only",
  async exportInvoice(input: ExportInput): Promise<ExportResult> {
    console.log(`[EXPORT disabled — connect QuickBooks/Xero] would export invoice ${input.invoiceNumber} from ${input.vendor}, total $${input.total}`);
    return { provider: "log_only", externalId: null };
  },
};
