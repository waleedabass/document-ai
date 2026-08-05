import type { ExportProvider } from "./types";
import { logOnlyExportProvider } from "./logOnly";

export function getExportProvider(): ExportProvider {
  // Real Xero/QuickBooks provider slots in here later behind the same
  // interface, gated the same way DRY_RUN_TICKETING worked in support-agent.
  return logOnlyExportProvider;
}

export type { ExportInput, ExportResult, ExportProvider } from "./types";
