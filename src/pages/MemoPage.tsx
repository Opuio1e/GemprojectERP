import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { db } from '../db';
import { logAudit } from '../utils/audit';

const stages = ['Acid', 'Heat', 'Rough', 'Preform', 'Cutting'];

const MemoPage = () => {
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const lots = useLiveQuery(() => db.lots.toArray(), []);
  const memos = useLiveQuery(() => db.memos.toArray(), []);
  const [memoNo, setMemoNo] = useState('MEMO-001');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [lotId, setLotId] = useState('');
  const [stage, setStage] = useState(stages[0]);
  const [direction, setDirection] = useState<'in' | 'out'>('out');
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

  const addMemo = async () => {
    const resolvedPartyId = await resolvePartyId(partyName);
    await db.memos.add({
      id: nanoid(),
      memoNo,
      date,
      partyId: resolvedPartyId,
      lotId,
      stage,
      direction,
      status: 'open',
      notes
    });
    await logAudit('memo', memoNo, 'create', 'Created memo record');
    setMemoNo(`MEMO-${Math.floor(Math.random() * 900 + 100)}`);
    setNotes('');
  };

  const closeMemo = async (id: string) => {
    await db.memos.update(id, { status: 'closed' });
    await logAudit('memo', id, 'lock', 'Closed memo record');
  };

  const deleteMemo = async (id: string) => {
    await db.memos.delete(id);
    await logAudit('memo', id, 'delete', 'Deleted memo record');
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

  const rows = (memos ?? []).map((memo) => {
    const actionContent =
      memo.status === 'closed' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Locked</span>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600"
            onClick={() => deleteMemo(memo.id)}
          >
            Delete
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => closeMemo(memo.id)}>
            Close Memo
          </Button>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600"
            onClick={() => deleteMemo(memo.id)}
          >
            Delete
          </Button>
        </div>
      );

    return [
      memo.memoNo,
      memo.date,
      parties?.find((party) => party.id === memo.partyId)?.name ?? '-',
      lots?.find((lot) => lot.id === memo.lotId)?.lotNo ?? '-',
      memo.stage,
      memo.direction,
      memo.status,
      memo.notes ?? '-',
      actionContent
    ];
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Memo In / Memo Out</h1>
        <p className="text-sm text-slate-500">
          Track lot movement between parties and production stages.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs uppercase text-slate-500">Memo No</label>
            <Input value={memoNo} onChange={(event) => setMemoNo(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <Input
              list="memo-party-list"
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
            <datalist id="memo-party-list">
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
            <label className="text-xs uppercase text-slate-500">Stage</label>
            <Select value={stage} onChange={(event) => setStage(event.target.value)}>
              {stages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Direction</label>
            <Select value={direction} onChange={(event) => setDirection(event.target.value as 'in' | 'out')}>
              <option value="in">In</option>
              <option value="out">Out</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase text-slate-500">Notes</label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={addMemo}>
            Save Memo
          </Button>
        </div>
      </div>

      <DataTable headers={headers} rows={rows} />
    </div>
  );
};

export default MemoPage;
