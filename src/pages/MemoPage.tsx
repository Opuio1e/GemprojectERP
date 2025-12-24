import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import jsPDF from 'jspdf';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { db } from '../db';
import type { InvoiceLineItem } from '../types';
import { logAudit } from '../utils/audit';
import { calculateInvoiceTotals } from '../utils/calculations';
import { exportInvoiceWorkbook, exportMemoWorkbook } from '../utils/importExport';

const stages = ['Acid', 'Heat', 'Rough', 'Preform', 'Cutting'];

const MemoPage = () => {
  const lots = useLiveQuery(() => db.lots.toArray(), []);
  const memos = useLiveQuery(() => db.memos.toArray(), []);
  const sellRecords = useLiveQuery(() => db.sellRecords.toArray(), []);
  const [memoNo, setMemoNo] = useState('MEMO-001');
  const [memoDate, setMemoDate] = useState(new Date().toISOString().slice(0, 10));
  const [memoParty, setMemoParty] = useState('');
  const [memoLotId, setMemoLotId] = useState('');
  const [memoStage, setMemoStage] = useState(stages[0]);
  const [memoDirection, setMemoDirection] = useState<'in' | 'out'>('out');
  const [memoNotes, setMemoNotes] = useState('');

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceParty, setInvoiceParty] = useState('');
  const [sellId, setSellId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('INV-001');
  const [transactionType, setTransactionType] = useState('Cash');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: nanoid(),
      srNo: 1,
      lotNo: '',
      description: '',
      shape: '',
      size: '',
      grade: '',
      pcs: 0,
      cts: 0,
      price: 0,
      amount: 0
    }
  ]);

  const totals = useMemo(() => calculateInvoiceTotals(lineItems), [lineItems]);

  const addMemo = async () => {
    await db.memos.add({
      id: nanoid(),
      memoNo,
      date: memoDate,
      partyId: memoParty,
      lotId: memoLotId,
      stage: memoStage,
      direction: memoDirection,
      status: 'open',
      notes: memoNotes
    });
    await logAudit('memo', memoNo, 'create', 'Created memo record');
    setMemoNo(`MEMO-${Math.floor(Math.random() * 900 + 100)}`);
    setMemoNotes('');
  };

  const closeMemo = async (id: string) => {
    await db.memos.update(id, { status: 'closed' });
    await logAudit('memo', id, 'lock', 'Closed memo record');
  };

  const handleSellSelect = async (value: string) => {
    setSellId(value);
    const record = sellRecords?.find((item) => item.sellId === value);
    if (record) {
      setLineItems(record.lineItems);
      setInvoiceParty(record.partyId ?? '');
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, [field]: value };
        const cts = Number(updated.cts ?? 0);
        const price = Number(updated.price ?? 0);
        return { ...updated, amount: Number(updated.amount ?? cts * price) };
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: nanoid(),
        srNo: prev.length + 1,
        lotNo: '',
        description: '',
        shape: '',
        size: '',
        grade: '',
        pcs: 0,
        cts: 0,
        price: 0,
        amount: 0
      }
    ]);
  };

  const clearInvoiceForm = () => {
    setSellId('');
    setInvoiceParty('');
    setInvoiceNo(`INV-${Math.floor(Math.random() * 900 + 100)}`);
    setLineItems([
      {
        id: nanoid(),
        srNo: 1,
        lotNo: '',
        description: '',
        shape: '',
        size: '',
        grade: '',
        pcs: 0,
        cts: 0,
        price: 0,
        amount: 0
      }
    ]);
  };

  const saveInvoice = async () => {
    await db.invoices.add({
      id: nanoid(),
      invoiceNo,
      date: invoiceDate,
      partyId: invoiceParty,
      sellId,
      transactionType,
      totalCts: totals.totalCts,
      totalAmount: totals.totalAmount,
      averagePrice: totals.averagePrice,
      lineItems
    });
    await logAudit('invoice', invoiceNo, 'create', 'Created invoice');
    clearInvoiceForm();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Invoice ${invoiceNo}`, 14, 16);
    doc.text(`Date: ${invoiceDate}`, 14, 24);
    doc.text(`Party: ${invoiceParty}`, 14, 32);
    doc.text(`Total CTS: ${totals.totalCts.toFixed(2)}`, 14, 40);
    doc.text(`Total Amount: ฿ ${totals.totalAmount.toFixed(2)}`, 14, 48);
    doc.save(`${invoiceNo}.pdf`);
  };

  const exportInvoiceExcel = async () => {
    await exportInvoiceWorkbook({
      invoiceNo,
      date: invoiceDate,
      party: invoiceParty,
      sellId,
      transactionType,
      totalCts: totals.totalCts,
      totalAmount: totals.totalAmount,
      averagePrice: totals.averagePrice,
      lineItems
    });
  };

  const headers = [
    'Memo No',
    'Date',
    'Party',
    'Lot',
    'Stage',
    'Direction',
    'Status',
    'Notes',
    'Action'
  ];

  const rows = (memos ?? []).map((memo) => [
    memo.memoNo,
    memo.date,
    memo.partyId ?? '-',
    lots?.find((lot) => lot.id === memo.lotId)?.lotNo ?? '-',
    memo.stage,
    memo.direction,
    memo.status,
    memo.notes ?? '-',
    memo.status === 'closed' ? (
      <span className="text-xs text-slate-400">Locked</span>
    ) : (
      <Button variant="ghost" onClick={() => closeMemo(memo.id)}>
        Close Memo
      </Button>
    )
  ]);

  const invoiceHeaders = [
    'SR No',
    'Lot No',
    'Description',
    'Shape',
    'Size',
    'Grade',
    'PCS',
    'CTS',
    'Price',
    'Amount'
  ];

  const invoiceRows = lineItems.map((item, index) => [
    item.srNo,
    <Input
      key={`${item.id}-lot`}
      value={item.lotNo}
      onChange={(event) => updateLineItem(index, 'lotNo', event.target.value)}
    />,
    <Input
      key={`${item.id}-desc`}
      value={item.description}
      onChange={(event) => updateLineItem(index, 'description', event.target.value)}
    />,
    <Input
      key={`${item.id}-shape`}
      value={item.shape}
      onChange={(event) => updateLineItem(index, 'shape', event.target.value)}
    />,
    <Input
      key={`${item.id}-size`}
      value={item.size}
      onChange={(event) => updateLineItem(index, 'size', event.target.value)}
    />,
    <Input
      key={`${item.id}-grade`}
      value={item.grade}
      onChange={(event) => updateLineItem(index, 'grade', event.target.value)}
    />,
    <Input
      key={`${item.id}-pcs`}
      type="number"
      value={item.pcs ?? 0}
      onChange={(event) => updateLineItem(index, 'pcs', event.target.value)}
    />,
    <Input
      key={`${item.id}-cts`}
      type="number"
      value={item.cts ?? 0}
      onChange={(event) => updateLineItem(index, 'cts', event.target.value)}
    />,
    <Input
      key={`${item.id}-price`}
      type="number"
      value={item.price ?? 0}
      onChange={(event) => updateLineItem(index, 'price', event.target.value)}
    />,
    <Input
      key={`${item.id}-amount`}
      type="number"
      value={item.amount ?? 0}
      onChange={(event) => updateLineItem(index, 'amount', event.target.value)}
    />
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Memo UI</h1>
            <p className="text-sm text-slate-500">
              Track memo movement between parties and production stages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportMemoWorkbook(memos ?? [])}>
              Export Memo XLSX
            </Button>
            <Button variant="primary" onClick={addMemo}>
              Save Memo
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs uppercase text-slate-500">Memo No</label>
            <Input value={memoNo} onChange={(event) => setMemoNo(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={memoDate} onChange={(event) => setMemoDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Input
              placeholder="Enter party name"
              value={memoParty}
              onChange={(event) => setMemoParty(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Lot</label>
            <Select value={memoLotId} onChange={(event) => setMemoLotId(event.target.value)}>
              <option value="">Select Lot</option>
              {lots?.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Stage</label>
            <Select value={memoStage} onChange={(event) => setMemoStage(event.target.value)}>
              {stages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Direction</label>
            <Select
              value={memoDirection}
              onChange={(event) => setMemoDirection(event.target.value as 'in' | 'out')}
            >
              <option value="in">In</option>
              <option value="out">Out</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase text-slate-500">Notes</label>
            <Input value={memoNotes} onChange={(event) => setMemoNotes(event.target.value)} />
          </div>
        </div>
      </div>

      <DataTable headers={headers} rows={rows} />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Invoice</h2>
            <p className="text-sm text-slate-500">Generate invoices alongside memos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={clearInvoiceForm}>
              Clear
            </Button>
            <Button variant="primary" onClick={saveInvoice}>
              Save / Generate
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Printable View
            </Button>
            <Button variant="secondary" onClick={exportInvoiceExcel}>
              Export Excel
            </Button>
            <Button variant="ghost" onClick={exportPdf}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Input
              placeholder="Enter party name"
              value={invoiceParty}
              onChange={(event) => setInvoiceParty(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Invoice No</label>
            <Input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Sell ID</label>
            <Input
              list="sell-id-list"
              placeholder="Enter Sell ID"
              value={sellId}
              onChange={(event) => handleSellSelect(event.target.value)}
            />
            <datalist id="sell-id-list">
              {sellRecords?.map((record) => (
                <option key={record.id} value={record.sellId} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Transaction Type</label>
            <Select
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Credit">Credit</option>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs uppercase text-slate-500">Total CTS</label>
              <Input value={totals.totalCts.toFixed(2)} readOnly />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500">Total Amount</label>
              <Input value={`฿ ${totals.totalAmount.toFixed(2)}`} readOnly />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500">Avg Price</label>
              <Input value={totals.averagePrice.toFixed(2)} readOnly />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-slate-500">Line Items</h3>
          <Button variant="secondary" onClick={addLineItem}>
            Add Row
          </Button>
        </div>
        <DataTable headers={invoiceHeaders} rows={invoiceRows} />
      </div>
    </div>
  );
};

export default MemoPage;
