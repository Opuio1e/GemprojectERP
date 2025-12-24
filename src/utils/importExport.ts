import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { db } from '../db';
import type {
  ImportSummary,
  InventoryRecord,
  Invoice,
  LedgerEntry,
  Lot,
  Memo,
  Party,
  ProductionStageEvent,
  SellRecord
} from '../types';
import { logAudit } from './audit';
import { calculateInvoiceTotals } from './calculations';

const normalizeHeader = (header: string) =>
  header.trim().toLowerCase().replace(/\s+/g, ' ');

const mapRow = (row: Record<string, unknown>) => {
  const mapped: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    mapped[normalizeHeader(key)] = value;
  });
  return mapped;
};

export const importWorkbook = async (file: File): Promise<ImportSummary> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const summary: ImportSummary = { sheets: [] };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const normalized = rows.map(mapRow);
    const unmappedColumns = new Set<string>();

    if (sheetName.toLowerCase().includes('party')) {
      const parties: Party[] = normalized.map((row) => ({
        id: nanoid(),
        name: String(row['party'] ?? row['name'] ?? 'Unknown Party'),
        category: String(row['category'] ?? row['type'] ?? ''),
        phone: String(row['phone'] ?? row['contact'] ?? ''),
        address: String(row['address'] ?? '')
      }));
      await db.parties.bulkAdd(parties);
      summary.sheets.push({ name: sheetName, records: parties.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('lot')) {
      const lots: Lot[] = normalized.map((row) => ({
        id: nanoid(),
        lotNo: String(row['lot no'] ?? row['lot'] ?? row['lotno'] ?? 'LOT'),
        description: String(row['description'] ?? ''),
        shape: String(row['shape'] ?? ''),
        size: String(row['size'] ?? ''),
        grade: String(row['grade'] ?? ''),
        source: String(row['source'] ?? ''),
        totalCts: Number(row['cts'] ?? row['total cts'] ?? 0),
        totalPcs: Number(row['pcs'] ?? row['total pcs'] ?? 0)
      }));
      await db.lots.bulkAdd(lots);
      summary.sheets.push({ name: sheetName, records: lots.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('inventory') || sheetName.toLowerCase().includes('sell')) {
      const records: InventoryRecord[] = normalized.map((row) => ({
        id: nanoid(),
        sellId: String(row['sell id'] ?? row['sellid'] ?? ''),
        date: String(row['date'] ?? new Date().toISOString().slice(0, 10)),
        partyId: String(row['party id'] ?? ''),
        lotId: String(row['lot id'] ?? ''),
        format: String(row['format'] ?? row['source'] ?? ''),
        shape: String(row['shape'] ?? ''),
        size: String(row['size'] ?? ''),
        description: String(row['description'] ?? ''),
        cts: Number(row['cts'] ?? 0),
        amount: Number(row['amount'] ?? 0),
        status: String(row['status'] ?? 'available') as InventoryRecord['status']
      }));
      await db.inventoryRecords.bulkAdd(records);
      summary.sheets.push({ name: sheetName, records: records.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('invoice')) {
      const invoices: Invoice[] = normalized.map((row) => {
        const lineItems = [];
        const totals = calculateInvoiceTotals(lineItems);
        return {
          id: nanoid(),
          invoiceNo: String(row['invoice no'] ?? row['invoice'] ?? ''),
          date: String(row['date'] ?? new Date().toISOString().slice(0, 10)),
          partyId: String(row['party id'] ?? ''),
          sellId: String(row['sell id'] ?? ''),
          transactionType: String(row['transaction type'] ?? ''),
          totalCts: totals.totalCts,
          totalAmount: totals.totalAmount,
          averagePrice: totals.averagePrice,
          lineItems
        };
      });
      await db.invoices.bulkAdd(invoices);
      summary.sheets.push({ name: sheetName, records: invoices.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('memo')) {
      const memos: Memo[] = normalized.map((row) => ({
        id: nanoid(),
        memoNo: String(row['memo no'] ?? row['memo'] ?? ''),
        date: String(row['date'] ?? new Date().toISOString().slice(0, 10)),
        partyId: String(row['party id'] ?? ''),
        lotId: String(row['lot id'] ?? ''),
        stage: String(row['stage'] ?? ''),
        direction: (String(row['direction'] ?? 'out') as Memo['direction']) ?? 'out',
        status: (String(row['status'] ?? 'open') as Memo['status']) ?? 'open',
        notes: String(row['notes'] ?? '')
      }));
      await db.memos.bulkAdd(memos);
      summary.sheets.push({ name: sheetName, records: memos.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('production')) {
      const stages: ProductionStageEvent[] = normalized.map((row) => ({
        id: nanoid(),
        lotId: String(row['lot id'] ?? ''),
        stage: String(row['stage'] ?? ''),
        date: String(row['date'] ?? new Date().toISOString().slice(0, 10)),
        inputCts: Number(row['input cts'] ?? 0),
        outputCts: Number(row['output cts'] ?? 0),
        rejectCts: Number(row['reject cts'] ?? 0),
        wastageCts: Number(row['wastage cts'] ?? 0),
        notes: String(row['notes'] ?? '')
      }));
      await db.productionStages.bulkAdd(stages);
      summary.sheets.push({ name: sheetName, records: stages.length, unmapped: [] });
      continue;
    }

    if (sheetName.toLowerCase().includes('cash') || sheetName.toLowerCase().includes('ledger')) {
      const entries: LedgerEntry[] = normalized.map((row) => ({
        id: nanoid(),
        date: String(row['date'] ?? new Date().toISOString().slice(0, 10)),
        partyId: String(row['party id'] ?? ''),
        lotId: String(row['lot id'] ?? ''),
        process: String(row['process'] ?? ''),
        debit: Number(row['debit'] ?? 0),
        credit: Number(row['credit'] ?? 0),
        notes: String(row['notes'] ?? ''),
        posted: Boolean(row['posted'] ?? false)
      }));
      await db.ledgerEntries.bulkAdd(entries);
      summary.sheets.push({ name: sheetName, records: entries.length, unmapped: [] });
      continue;
    }

    if (normalized.length > 0) {
      Object.keys(normalized[0]).forEach((key) => {
        unmappedColumns.add(key);
      });
      summary.sheets.push({
        name: sheetName,
        records: normalized.length,
        unmapped: Array.from(unmappedColumns)
      });
    }
  }

  await logAudit('import', file.name, 'import', 'Imported workbook data');
  return summary;
};

export const exportWorkbook = async () => {
  const workbook = XLSX.utils.book_new();
  const parties = await db.parties.toArray();
  const lots = await db.lots.toArray();
  const inventory = await db.inventoryRecords.toArray();
  const sellRecords = await db.sellRecords.toArray();
  const invoices = await db.invoices.toArray();
  const memos = await db.memos.toArray();
  const production = await db.productionStages.toArray();
  const ledger = await db.ledgerEntries.toArray();

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(parties), 'Parties');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lots), 'Lots');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(inventory), 'Inventory');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sellRecords), 'SellRecords');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invoices), 'Invoices');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(memos), 'Memos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(production), 'Production');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ledger), 'Cashbook');

  XLSX.writeFile(workbook, 'gemproject-erp-export.xlsx');
  await logAudit('export', 'workbook', 'export', 'Exported workbook');
};

export const exportCsvReport = async (name: string, rows: Record<string, unknown>[]) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, name);
  XLSX.writeFile(workbook, `${name}.csv`, { bookType: 'csv' });
  await logAudit('export', name, 'export', 'Exported CSV report');
};
