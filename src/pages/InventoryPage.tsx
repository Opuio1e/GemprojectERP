import { useMemo, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import SummaryCard from '../components/SummaryCard';
import { calculateInventorySummary } from '../utils/calculations';
import { importWorkbook } from '../utils/importExport';
import { logAudit } from '../utils/audit';
import { formatCurrency } from '../utils/formatters';

const InventoryPage = () => {
  const records = useLiveQuery(() => db.inventoryRecords.toArray(), []);
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const lots = useLiveQuery(() => db.lots.toArray(), []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<string>('');

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter((record) => {
      const matchesSearch =
        search.length === 0 ||
        [
          record.sellId,
          record.description,
          record.shape,
          record.size,
          record.format
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = statusFilter ? record.status === statusFilter : true;
      const matchesFormat = formatFilter ? record.format === formatFilter : true;
      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [records, search, statusFilter, formatFilter]);

  const summary = calculateInventorySummary(filteredRecords);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const markSold = async () => {
    await db.inventoryRecords
      .where('id')
      .anyOf(selectedIds)
      .modify({ status: 'sold' });
    await logAudit('inventory', selectedIds.join(','), 'update', 'Marked records as sold');
    clearSelection();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const summaryResult = await importWorkbook(file);
    setImportResult(
      summaryResult.sheets
        .map((sheet) => `${sheet.name}: ${sheet.records} rows`) 
        .join(' | ')
    );
  };

  const headers = [
    '',
    'Sell ID',
    'Date',
    'Party',
    'Lot',
    'Format',
    'Shape',
    'Size',
    'Description',
    'CTS',
    'Amount',
    'Status'
  ];

  const rows = filteredRecords.map((record) => {
    const party = parties?.find((item) => item.id === record.partyId);
    const lot = lots?.find((item) => item.id === record.lotId);
    return [
      <input
        key={`${record.id}-select`}
        type="checkbox"
        checked={selectedIds.includes(record.id)}
        onChange={() => toggleSelection(record.id)}
      />,
      record.sellId ?? '-',
      record.date,
      party?.name ?? '-',
      lot?.lotNo ?? '-',
      record.format ?? '-',
      record.shape ?? '-',
      record.size ?? '-',
      record.description ?? '-',
      record.cts.toFixed(2),
      formatCurrency(record.amount),
      record.status ?? 'available'
    ];
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Inventory / Sell Records</h1>
            <p className="text-sm text-slate-500">
              Track live inventory, filter sell records, and batch sell actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Import Workbook
              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
            </label>
            <Button variant="primary" onClick={markSold} disabled={selectedIds.length === 0}>
              Sell Selected
            </Button>
          </div>
        </div>
        {importResult ? <p className="text-xs text-slate-500">{importResult}</p> : null}
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard title="Records" value={summary.totalRecords} footer="Visible records" />
          <SummaryCard title="Remaining CTS" value={summary.remainingCts.toFixed(2)} />
          <SummaryCard title="Remaining Amount" value={formatCurrency(summary.remainingAmount)} />
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-white p-4 shadow-sm md:grid-cols-4">
        <Input
          placeholder="Search Sell ID, shape, lot, description..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="memo">Memo</option>
        </Select>
        <Select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}>
          <option value="">All Formats</option>
          <option value="Calip">Calip</option>
          <option value="Parcel">Parcel</option>
          <option value="Mix">Mix</option>
        </Select>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={clearSelection}>
            Clear Selection
          </Button>
          <Button variant="secondary">Update…</Button>
        </div>
      </div>

      <DataTable headers={headers} rows={rows} />
    </div>
  );
};

export default InventoryPage;
