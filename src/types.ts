export type AuditAction =
  | 'create'
  | 'update'
  | 'lock'
  | 'post'
  | 'import'
  | 'export';

export interface Party {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  address?: string;
}

export interface Lot {
  id: string;
  lotNo: string;
  description?: string;
  shape?: string;
  size?: string;
  grade?: string;
  source?: string;
  totalCts?: number;
  totalPcs?: number;
}

export interface InventoryRecord {
  id: string;
  sellId?: string;
  date: string;
  partyId?: string;
  lotId?: string;
  format?: string;
  shape?: string;
  size?: string;
  description?: string;
  cts: number;
  amount: number;
  status?: 'available' | 'sold' | 'memo';
}

export interface SellRecord {
  id: string;
  sellId: string;
  date: string;
  partyId?: string;
  transactionType?: string;
  lineItems: InvoiceLineItem[];
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  partyId?: string;
  sellId?: string;
  transactionType?: string;
  totalCts: number;
  totalAmount: number;
  averagePrice: number;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  srNo: number;
  lotNo?: string;
  description?: string;
  shape?: string;
  size?: string;
  grade?: string;
  pcs?: number;
  cts?: number;
  price?: number;
  amount?: number;
}

export interface Memo {
  id: string;
  memoNo: string;
  date: string;
  partyId?: string;
  lotId?: string;
  stage: string;
  direction: 'in' | 'out';
  status: 'open' | 'closed';
  notes?: string;
}

export interface ProductionStageEvent {
  id: string;
  lotId: string;
  stage: string;
  date: string;
  inputCts?: number;
  outputCts?: number;
  rejectCts?: number;
  wastageCts?: number;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  partyId?: string;
  lotId?: string;
  process?: string;
  debit: number;
  credit: number;
  notes?: string;
  posted: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  summary: string;
}

export interface ImportSummary {
  sheets: { name: string; records: number; unmapped: string[] }[];
}
