import { useState } from 'react';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { fetchTable, insertRow, updateRow, deleteRow } from '../db';
import { useSupabaseTable } from '../db/useSupabaseTable';
import type { Lot, Memo, Party } from '../types';
import { logAudit } from '../utils/audit';
import { exportMemoWorkbook } from '../utils/importExport';

const stages = [
  'Acid',
  'Heat 1 Rough',
  'Heat 2 Rough',
  'Rough to Preform',
  'Rough to Calibrate',
  'Preform to Calibrate',
  'Preform to Heat',
  'Preform to Cutting',
  'Rough to Cutting'
];

const MemoPage = () => {
  const { data: parties, refresh: refreshParties } = useSupabaseTable<Party>('parties');
  const { data: lots, refresh: refreshLots } = useSupabaseTable<Lot>('lots');
  const { data: memos, refresh: refreshMemos } = useSupabaseTable<Memo>('memos');
  const [memoNo, setMemoNo] = useState('MEMO-001');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [lotId, setLotId] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [stage, setStage] = useState(stages[0]);
  const [direction, setDirection] = useState<'in' | 'out'>('out');
  const [notes, setNotes] = useState('');

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

  const resolveLotId = async (number: string) => {
    const trimmedNumber = number.trim();
    if (!trimmedNumber) return '';
    const currentLots = lots ?? (await fetchTable<Lot>('lots'));
    const existing = currentLots.find(
      (lot) => lot.lotNo.trim().toLowerCase() === trimmedNumber.toLowerCase()
    );
    if (existing) {
      setLotId(existing.id);
      return existing.id;
    }
    const id = nanoid();
    await insertRow('lots', { id, lotNo: trimmedNumber });
    setLotId(id);
    await refreshLots();
    return id;
  };

  const addMemo = async () => {
    const resolvedPartyId = await resolvePartyId(partyName);
    const resolvedLotId = await resolveLotId(lotNo);
    await insertRow('memos', {
      id: nanoid(),
      memoNo,
      date,
      partyId: resolvedPartyId,
      lotId: resolvedLotId,
      stage,
      direction,
      status: 'open',
      notes
    });
    await logAudit('memo', memoNo, 'create', 'Created memo record');
    setMemoNo(`MEMO-${Math.floor(Math.random() * 900 + 100)}`);
    setNotes('');
    await refreshMemos();
  };

  const closeMemo = async (id: string) => {
    await updateRow<Memo>('memos', id, { status: 'closed' });
    await logAudit('memo', id, 'lock', 'Closed memo record');
    await refreshMemos();
  };

  const deleteMemo = async (id: string) => {
    await deleteRow('memos', id);
    await logAudit('memo', id, 'delete', 'Deleted memo record');
    await refreshMemos();
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
            <Input
              list="memo-lot-list"
              value={lotNo}
              onChange={(event) => {
                const value = event.target.value;
                setLotNo(value);
                const matched = lots?.find(
                  (lot) => lot.lotNo.trim().toLowerCase() === value.trim().toLowerCase()
                );
                setLotId(matched?.id ?? '');
              }}
            />
            <datalist id="memo-lot-list">
              {lots?.map((lot) => (
                <option key={lot.id} value={lot.lotNo} />
              ))}
            </datalist>
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
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={exportMemoWorkbook}>
            Export XLSX
          </Button>
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
