import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { db } from '../db';
import { calculateLedgerBalance } from '../utils/calculations';
import { logAudit } from '../utils/audit';

const CashbookPage = () => {
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const lots = useLiveQuery(() => db.lots.toArray(), []);
  const entries = useLiveQuery(() => db.ledgerEntries.toArray(), []);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [lotId, setLotId] = useState('');
  const [process, setProcess] = useState('Sale');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [notes, setNotes] = useState('');

  const resolvePartyId = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return '';
    const currentParties = parties ?? (await db.parties.toArray());
    const existing = currentParties.find(
      (party) => party.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      setPartyId(existing.id);
      return existing.id;
    }
    const id = nanoid();
    await db.parties.add({ id, name: trimmedName });
    setPartyId(id);
    return id;
  };

  const addEntry = async () => {
    const resolvedPartyId = await resolvePartyId(partyName);
    await db.ledgerEntries.add({
      id: nanoid(),
      date,
      partyId: resolvedPartyId,
      lotId,
      process,
      debit: Number(debit || 0),
      credit: Number(credit || 0),
      notes,
      posted: false
    });
    await logAudit('cashbook', date, 'create', 'Added ledger entry');
    setNotes('');
  };

  const postEntry = async (id: string) => {
    await db.ledgerEntries.update(id, { posted: true });
    await logAudit('cashbook', id, 'post', 'Posted ledger entry');
  };

  const rowsWithBalance = useMemo(() => calculateLedgerBalance(entries ?? []), [entries]);

  const headers = [
    'Date',
    'Party',
    'Lot',
    'Process',
    'Debit',
    'Credit',
    'Running Balance',
    'Notes',
    'Status'
  ];

  const rows = rowsWithBalance.map((entry) => [
    entry.date,
    parties?.find((party) => party.id === entry.partyId)?.name ?? '-',
    lots?.find((lot) => lot.id === entry.lotId)?.lotNo ?? '-',
    entry.process ?? '-',
    entry.debit.toFixed(2),
    entry.credit.toFixed(2),
    entry.runningBalance.toFixed(2),
    entry.notes ?? '-',
    entry.posted ? (
      <span className="text-xs text-slate-400">Posted</span>
    ) : (
      <Button variant="ghost" onClick={() => postEntry(entry.id)}>
        Post Entry
      </Button>
    )
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Cashbook / Ledger</h1>
        <p className="text-sm text-slate-500">
          Record debit/credit entries with running balances and posting locks.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Input
              list="cashbook-party-list"
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
            <datalist id="cashbook-party-list">
              {parties?.map((party) => (
                <option key={party.id} value={party.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Lot</label>
            <Select value={lotId} onChange={(event) => setLotId(event.target.value)}>
              <option value="">Select Lot</option>
              {lots?.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Process</label>
            <Input value={process} onChange={(event) => setProcess(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Debit</label>
            <Input value={debit} onChange={(event) => setDebit(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Credit</label>
            <Input value={credit} onChange={(event) => setCredit(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase text-slate-500">Notes</label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={addEntry}>
            Add Entry
          </Button>
        </div>
      </div>

      <DataTable headers={headers} rows={rows} />
    </div>
  );
};

export default CashbookPage;
