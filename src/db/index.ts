import Dexie, { type Table } from 'dexie';
import type {
  AuditLog,
  Invoice,
  InventoryRecord,
  LedgerEntry,
  Lot,
  Memo,
  Party,
  ProductionStageEvent,
  SellRecord
} from '../types';

export class GemprojectDb extends Dexie {
  parties!: Table<Party, string>;
  lots!: Table<Lot, string>;
  inventoryRecords!: Table<InventoryRecord, string>;
  sellRecords!: Table<SellRecord, string>;
  invoices!: Table<Invoice, string>;
  memos!: Table<Memo, string>;
  productionStages!: Table<ProductionStageEvent, string>;
  ledgerEntries!: Table<LedgerEntry, string>;
  auditLog!: Table<AuditLog, string>;

  constructor() {
    super('gemproject-erp');
    this.version(1).stores({
      parties: 'id, name, category',
      lots: 'id, lotNo, description, shape, size, grade',
      inventoryRecords: 'id, sellId, date, partyId, lotId, status',
      sellRecords: 'id, sellId, date, partyId',
      invoices: 'id, invoiceNo, date, partyId, sellId',
      memos: 'id, memoNo, date, partyId, lotId, stage, direction, status',
      productionStages: 'id, lotId, stage, date',
      ledgerEntries: 'id, date, partyId, lotId, process, posted',
      auditLog: 'id, timestamp, entityType, entityId, action'
    });
  }
}

export const db = new GemprojectDb();
