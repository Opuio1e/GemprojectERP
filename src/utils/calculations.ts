import type { InventoryRecord, InvoiceLineItem, LedgerEntry } from '../types';

export const calculateInventorySummary = (records: InventoryRecord[]) => {
  const remainingCts = records.reduce(
    (sum, record) => sum + (record.status === 'sold' ? 0 : record.cts),
    0
  );
  const remainingAmount = records.reduce(
    (sum, record) => sum + (record.status === 'sold' ? 0 : record.amount),
    0
  );
  return {
    totalRecords: records.length,
    remainingCts,
    remainingAmount
  };
};

export const calculateInvoiceTotals = (items: InvoiceLineItem[]) => {
  const totalCts = items.reduce((sum, item) => sum + (item.cts ?? 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const averagePrice = totalCts > 0 ? totalAmount / totalCts : 0;
  return { totalCts, totalAmount, averagePrice };
};

export const calculateLedgerBalance = (entries: LedgerEntry[]) => {
  let balance = 0;
  return entries.map((entry) => {
    balance += entry.credit - entry.debit;
    return { ...entry, runningBalance: balance };
  });
};
