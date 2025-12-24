import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { db } from '../db';
import type { InvoiceLineItem } from '../types';
import { calculateInvoiceTotals } from '../utils/calculations';
import { logAudit } from '../utils/audit';
import { formatCurrency, parseCurrencyInput } from '../utils/formatters';
import jsPDF from 'jspdf';

const InvoicePage = () => {
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const sellRecords = useLiveQuery(() => db.sellRecords.toArray(), []);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
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

  const handleSellSelect = async (value: string) => {
    setSellId(value);
    const record = sellRecords?.find((item) => item.sellId === value);
    if (record) {
      setLineItems(record.lineItems);
      setPartyId(record.partyId ?? '');
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

  const clearForm = () => {
    setSellId('');
    setPartyId('');
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
      date,
      partyId,
      sellId,
      transactionType,
      totalCts: totals.totalCts,
      totalAmount: totals.totalAmount,
      averagePrice: totals.averagePrice,
      lineItems
    });
    await logAudit('invoice', invoiceNo, 'create', 'Created invoice');
    clearForm();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Invoice ${invoiceNo}`, 14, 16);
    doc.text(`Date: ${date}`, 14, 24);
    doc.text(`Party: ${parties?.find((item) => item.id === partyId)?.name ?? ''}`, 14, 32);
    doc.text(`Total CTS: ${totals.totalCts.toFixed(2)}`, 14, 40);
    doc.text(`Total Amount: ${formatCurrency(totals.totalAmount)}`, 14, 48);
    doc.save(`${invoiceNo}.pdf`);
  };

  const headers = [
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

  const rows = lineItems.map((item, index) => [
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
      type="text"
      value={formatCurrency(item.amount ?? 0)}
      onChange={(event) =>
        updateLineItem(index, 'amount', String(parseCurrencyInput(event.target.value)))
      }
    />
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Invoice</h1>
            <p className="text-sm text-slate-500">Generate invoices from sell records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={clearForm}>
              Clear
            </Button>
            <Button variant="primary" onClick={saveInvoice}>
              Save / Generate
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Printable View
            </Button>
            <Button variant="ghost" onClick={exportPdf}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Select value={partyId} onChange={(event) => setPartyId(event.target.value)}>
              <option value="">Select Party</option>
              {parties?.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Invoice No</label>
            <Input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Sell ID</label>
            <Select value={sellId} onChange={(event) => handleSellSelect(event.target.value)}>
              <option value="">Select Sell ID</option>
              {sellRecords?.map((record) => (
                <option key={record.id} value={record.sellId}>
                  {record.sellId}
                </option>
              ))}
            </Select>
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
              <Input value={formatCurrency(totals.totalAmount)} readOnly />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500">Avg Price</label>
              <Input value={formatCurrency(totals.averagePrice)} readOnly />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Line Items</h2>
          <Button variant="secondary" onClick={addLineItem}>
            Add Row
          </Button>
        </div>
        <DataTable headers={headers} rows={rows} />
      </div>
    </div>
  );
};

export default InvoicePage;
