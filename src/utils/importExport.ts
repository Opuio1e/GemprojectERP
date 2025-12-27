import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { fetchTable, upsertRows } from '../db';
import type {
  ImportSummary,
  InventoryRecord,
  Invoice,
  InvoiceLineItem,
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

const sanitizeSheetName = (name: string, fallback: string) => {
  const cleaned = name.replace(/[\\/?*[\]:]/g, '-').slice(0, 31).trim();
  return cleaned || fallback;
};

const buildMemoFormSheet = ({
  memoNo = '',
  memoDate = '',
  partyName = '',
  partyPhone = '',
  lot,
  notes = ''
}: {
  memoNo?: string;
  memoDate?: string;
  partyName?: string;
  partyPhone?: string;
  lot?: Lot;
  notes?: string;
}) => {
  const rows = [
    ['RECUT'],
    ['Memo No', memoNo, '', '', '', 'Date', memoDate],
    ['To/From', partyName, '', '', '', 'Tel', partyPhone],
    [],
    ['No.', 'Code', 'Description', 'Size', 'PCS', 'Weight', 'Return', 'Kept', 'Price', 'Remark'],
    [
      1,
      lot?.lotNo ?? '',
      lot?.description ?? '',
      lot?.size ?? '',
      lot?.totalPcs ?? '',
      lot?.totalCts ?? '',
      '',
      '',
      '',
      notes
    ]
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 }
  ];
  return sheet;
};

const buildInvoiceFormSheet = ({
  invoiceNo = '',
  invoiceDate = '',
  partyName = '',
  sellId = '',
  transactionType = '',
  averagePrice = '',
  totalCts = '',
  totalAmount = '',
  lineItems = []
}: {
  invoiceNo?: string;
  invoiceDate?: string;
  partyName?: string;
  sellId?: string;
  transactionType?: string;
  averagePrice?: number | string;
  totalCts?: number | string;
  totalAmount?: number | string;
  lineItems?: InvoiceLineItem[];
}) => {
  const rows = [
    ['INVOICE'],
    ['Date', invoiceDate, '', '', '', 'Invoice No', invoiceNo],
    ['Party', partyName, '', '', '', 'Sell ID', sellId],
    ['Transaction Type', transactionType, '', '', '', 'Average Price', averagePrice],
    ['Total CTS', totalCts, '', '', '', 'Total Amount', totalAmount],
    [],
    ['SR No', 'Lot No', 'Description', 'Shape', 'Size', 'Grade', 'PCS', 'CTS', 'Price', 'Amount', 'Remarks']
  ];

  const itemRows =
    lineItems.length > 0
      ? lineItems.map((item) => [
          item.srNo,
          item.lotNo ?? '',
          item.description ?? '',
          item.shape ?? '',
          item.size ?? '',
          item.grade ?? '',
          item.pcs ?? '',
          item.cts ?? '',
          item.price ?? '',
          item.amount ?? '',
          ''
        ])
      : [[1, '', '', '', '', '', '', '', '', '', '']];

  const sheet = XLSX.utils.aoa_to_sheet([...rows, ...itemRows]);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 }
  ];
  return sheet;
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
      await upsertRows('parties', parties);
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
      await upsertRows('lots', lots);
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
      await upsertRows('inventory_records', records);
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
      await upsertRows('invoices', invoices);
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
      await upsertRows('memos', memos);
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
      await upsertRows('production_stages', stages);
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
      await upsertRows('ledger_entries', entries);
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
  const parties = await fetchTable<Party>('parties');
  const lots = await fetchTable<Lot>('lots');
  const inventory = await fetchTable<InventoryRecord>('inventory_records');
  const sellRecords = await fetchTable<SellRecord>('sell_records');
  const invoices = await fetchTable<Invoice>('invoices');
  const memos = await fetchTable<Memo>('memos');
  const production = await fetchTable<ProductionStageEvent>('production_stages');
  const ledger = await fetchTable<LedgerEntry>('ledger_entries');

  if (memos.length === 0) {
    XLSX.utils.book_append_sheet(workbook, buildMemoFormSheet({}), 'Memo Template');
  } else {
    memos.forEach((memo, index) => {
      const party = parties.find((item) => item.id === memo.partyId);
      const lot = lots.find((item) => item.id === memo.lotId);
      const sheet = buildMemoFormSheet({
        memoNo: memo.memoNo,
        memoDate: memo.date,
        partyName: party?.name ?? '',
        partyPhone: party?.phone ?? '',
        lot,
        notes: memo.notes ?? ''
      });
      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        sanitizeSheetName(`Memo-${memo.memoNo || index + 1}`, `Memo-${index + 1}`)
      );
    });
  }

  if (invoices.length === 0) {
    XLSX.utils.book_append_sheet(workbook, buildInvoiceFormSheet({}), 'Invoice Template');
  } else {
    invoices.forEach((invoice, index) => {
      const party = parties.find((item) => item.id === invoice.partyId);
      const sheet = buildInvoiceFormSheet({
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.date,
        partyName: party?.name ?? '',
        sellId: invoice.sellId ?? '',
        transactionType: invoice.transactionType ?? '',
        averagePrice: invoice.averagePrice?.toFixed(2) ?? '',
        totalCts: invoice.totalCts?.toFixed(2) ?? '',
        totalAmount: invoice.totalAmount?.toFixed(2) ?? '',
        lineItems: invoice.lineItems ?? []
      });
      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        sanitizeSheetName(`Invoice-${invoice.invoiceNo || index + 1}`, `Invoice-${index + 1}`)
      );
    });
  }

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
