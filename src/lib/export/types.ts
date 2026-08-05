export interface ExportInput {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface ExportResult {
  provider: string;
  externalId: string | null;
}

export interface ExportProvider {
  name: string;
  exportInvoice(input: ExportInput): Promise<ExportResult>;
}
