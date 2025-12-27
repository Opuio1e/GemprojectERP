import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { fetchTable, insertRow } from '../db';
import { useSupabaseTable } from '../db/useSupabaseTable';
import type { Invoice, InvoiceLineItem, Party, SellRecord } from '../types';
import { calculateInvoiceTotals } from '../utils/calculations';
import { logAudit } from '../utils/audit';
import { formatCurrency, parseCurrencyInput } from '../utils/formatters';
import jsPDF from 'jspdf';

const InvoicePage = () => {
  const { data: parties, refresh: refreshParties } = useSupabaseTable<Party>('parties');
  const { data: sellRecords, refresh: refreshSellRecords } =
    useSupabaseTable<SellRecord>('sell_records');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [sellId, setSellId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('INV-001');
  const [transactionType, setTransactionType] = useState('Cash');
  const createLineItem = (srNo: number): InvoiceLineItem => ({
    id: nanoid(),
    srNo,
    lotNo: '',
    description: '',
    shape: '',
    size: '',
    grade: '',
    pcs: 0,
    cts: 0,
    price: 0,
    amount: 0
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([createLineItem(1)]);

  const totals = useMemo(() => calculateInvoiceTotals(lineItems), [lineItems]);

  const resolvePartyId = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return '';
    const currentParties = parties ?? (await fetchTable<Party>('parties'));
    const existing = currentParties.find(
      (party) => party.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      setPartyId(existing.id);
      return existing.id;
    }
    const id = nanoid();
    await insertRow('parties', { id, name: trimmedName });
    setPartyId(id);
    await refreshParties();
    return id;
  };

  const handleSellSelect = async (value: string) => {
    setSellId(value);
    const record = sellRecords?.find((item) => item.sellId === value);
    if (record) {
      setLineItems(record.lineItems);
      setPartyId(record.partyId ?? '');
      setPartyName(parties?.find((party) => party.id === record.partyId)?.name ?? '');
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
    setLineItems((prev) => [...prev, createLineItem(prev.length + 1)]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => {
      if (prev.length === 1) {
        return [createLineItem(1)];
      }
      const remaining = prev.filter((item) => item.id !== id);
      return remaining.map((item, index) => ({ ...item, srNo: index + 1 }));
    });
  };

  const clearForm = () => {
    setSellId('');
    setPartyId('');
    setPartyName('');
    setInvoiceNo(`INV-${Math.floor(Math.random() * 900 + 100)}`);
    setLineItems([createLineItem(1)]);
  };

  const saveInvoice = async () => {
    const resolvedPartyId = await resolvePartyId(partyName);
    const invoice: Invoice = {
      id: nanoid(),
      invoiceNo,
      date,
      partyId: resolvedPartyId,
      sellId,
      transactionType,
      totalCts: totals.totalCts,
      totalAmount: totals.totalAmount,
      averagePrice: totals.averagePrice,
      lineItems
    };
    await insertRow('invoices', invoice);
    await logAudit('invoice', invoiceNo, 'create', 'Created invoice');
    clearForm();
    await refreshSellRecords();
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
    'Amount',
    'Action'
  ];

  const rows = lineItems.map((item, index) => [
    item.srNo,
    <Input
      key={`${item.id}-lot`}
      className="print:hidden"
      value={item.lotNo}
      onChange={(event) => updateLineItem(index, 'lotNo', event.target.value)}
    />,
    <Input
      key={`${item.id}-desc`}
      className="print:hidden"
      value={item.description}
      onChange={(event) => updateLineItem(index, 'description', event.target.value)}
    />,
    <Input
      key={`${item.id}-shape`}
      className="print:hidden"
      value={item.shape}
      onChange={(event) => updateLineItem(index, 'shape', event.target.value)}
    />,
    <Input
      key={`${item.id}-size`}
      className="print:hidden"
      value={item.size}
      onChange={(event) => updateLineItem(index, 'size', event.target.value)}
    />,
    <Input
      key={`${item.id}-grade`}
      className="print:hidden"
      value={item.grade}
      onChange={(event) => updateLineItem(index, 'grade', event.target.value)}
    />,
    <Input
      key={`${item.id}-pcs`}
      type="number"
      className="print:hidden"
      value={item.pcs ?? 0}
      onChange={(event) => updateLineItem(index, 'pcs', event.target.value)}
    />,
    <Input
      key={`${item.id}-cts`}
      type="number"
      className="print:hidden"
      value={item.cts ?? 0}
      onChange={(event) => updateLineItem(index, 'cts', event.target.value)}
    />,
    <Input
      key={`${item.id}-price`}
      type="number"
      className="print:hidden"
      value={item.price ?? 0}
      onChange={(event) => updateLineItem(index, 'price', event.target.value)}
    />,
    <Input
      key={`${item.id}-amount`}
      type="text"
      className="print:hidden"
      value={formatCurrency(item.amount ?? 0)}
      onChange={(event) =>
        updateLineItem(index, 'amount', String(parseCurrencyInput(event.target.value)))
      }
    />,
    <Button
      variant="ghost"
      className="text-red-500 hover:text-red-600 print:hidden"
      onClick={() => removeLineItem(item.id)}
    >
      Delete
    </Button>
  ]);

  return (
    <div className="space-y-6">
      <div className="print-block hidden print:!block">
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Invoice</h1>
            <p className="text-xs text-slate-600">Printable invoice summary</p>
          </div>
          <table className="print-meta w-full text-sm">
            <tbody>
              <tr>
                <td className="print-label">Invoice No</td>
                <td>{invoiceNo}</td>
                <td className="print-label">Date</td>
                <td>{date}</td>
              </tr>
              <tr>
                <td className="print-label">Party</td>
                <td>{parties?.find((item) => item.id === partyId)?.name ?? partyName}</td>
                <td className="print-label">Sell ID</td>
                <td>{sellId}</td>
              </tr>
              <tr>
                <td className="print-label">Total CTS</td>
                <td>{totals.totalCts.toFixed(2)}</td>
                <td className="print-label">Total Amount</td>
                <td>{formatCurrency(totals.totalAmount)}</td>
              </tr>
              <tr>
                <td className="print-label">Avg Price</td>
                <td>{formatCurrency(totals.averagePrice)}</td>
                <td className="print-label">Transaction</td>
                <td>{transactionType}</td>
              </tr>
            </tbody>
          </table>
          <table className="print-table w-full text-xs">
            <thead>
              <tr>
                {headers.slice(0, -1).map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.srNo}</td>
                  <td>{item.lotNo}</td>
                  <td>{item.description}</td>
                  <td>{item.shape}</td>
                  <td>{item.size}</td>
                  <td>{item.grade}</td>
                  <td>{item.pcs}</td>
                  <td>{item.cts}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Invoice</h1>
            <p className="text-sm text-slate-500">Generate invoices from sell records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="print:hidden" onClick={clearForm}>
              Clear
            </Button>
            <Button variant="primary" className="print:hidden" onClick={saveInvoice}>
              Save / Generate
            </Button>
            <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
              Printable View
            </Button>
            <Button variant="ghost" className="print:hidden" onClick={exportPdf}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input
              className="print:hidden"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Input
              className="print:hidden"
              list="invoice-party-list"
              value={partyName}
              onChange={(event) => {
                const value = event.target.value;
                setPartyName(value);
                const matched = parties?.find(
                  (party) => party.name.trim().toLowerCase() === value.trim().toLowerCase()
                );
                setPartyId(matched?.id ?? '');
              }}
            />
            <datalist id="invoice-party-list">
              {parties?.map((party) => (
                <option key={party.id} value={party.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Invoice No</label>
            <Input
              className="print:hidden"
              value={invoiceNo}
              onChange={(event) => setInvoiceNo(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Sell ID</label>
            <Select
              className="print:hidden"
              value={sellId}
              onChange={(event) => handleSellSelect(event.target.value)}
            >
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
              className="print:hidden"
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
              <Input className="print:hidden" value={totals.totalCts.toFixed(2)} readOnly />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500">Total Amount</label>
              <Input className="print:hidden" value={formatCurrency(totals.totalAmount)} readOnly />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500">Avg Price</label>
              <Input
                className="print:hidden"
                value={formatCurrency(totals.averagePrice)}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Line Items</h2>
          <Button variant="secondary" className="print:hidden" onClick={addLineItem}>
            Add Row
          </Button>
        </div>
        <DataTable headers={headers} rows={rows} />
      </div>
    </div>
  );
};

export default InvoicePage;
