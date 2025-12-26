import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Select from '../components/Select';
import { db } from '../db';
import { logAudit } from '../utils/audit';

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

const ProductionPage = () => {
  const lots = useLiveQuery(() => db.lots.toArray(), []);
  const events = useLiveQuery(() => db.productionStages.toArray(), []);
  const [lotId, setLotId] = useState('');
  const [stage, setStage] = useState(stages[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inputCts, setInputCts] = useState('');
  const [outputCts, setOutputCts] = useState('');
  const [rejectCts, setRejectCts] = useState('');
  const [wastageCts, setWastageCts] = useState('');
  const [notes, setNotes] = useState('');

  const addEvent = async () => {
    await db.productionStages.add({
      id: nanoid(),
      lotId,
      stage,
      date,
      inputCts: Number(inputCts || 0),
      outputCts: Number(outputCts || 0),
      rejectCts: Number(rejectCts || 0),
      wastageCts: Number(wastageCts || 0),
      notes
    });
    await logAudit('production', lotId, 'create', 'Added stage event');
    setNotes('');
  };

  const deleteEvent = async (id: string) => {
    await db.productionStages.delete(id);
    await logAudit('production', id, 'delete', 'Deleted stage event');
  };

  const headers = [
    'Lot',
    'Stage',
    'Date',
    'Input CTS',
    'Output CTS',
    'Reject CTS',
    'Wastage CTS',
    'Yield %',
    'Notes',
    'Action'
  ];

  const rows = (events ?? []).map((event) => {
    const yieldPercent = event.inputCts
      ? (((event.outputCts ?? 0) / event.inputCts) * 100).toFixed(1)
      : '0';
    return [
      lots?.find((lot) => lot.id === event.lotId)?.lotNo ?? '-',
      event.stage,
      event.date,
      event.inputCts ?? 0,
      event.outputCts ?? 0,
      event.rejectCts ?? 0,
      event.wastageCts ?? 0,
      `${yieldPercent}%`,
      event.notes ?? '-',
      <Button
        key={`${event.id}-delete`}
        variant="ghost"
        className="text-red-500 hover:text-red-600"
        onClick={() => deleteEvent(event.id)}
      >
        Delete
      </Button>
    ];
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Production Tracking</h1>
        <p className="text-sm text-slate-500">Track stage-wise yield, reject, and wastage.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
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
            <label className="text-xs uppercase text-slate-500">Date</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Input CTS</label>
            <Input value={inputCts} onChange={(event) => setInputCts(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Output CTS</label>
            <Input value={outputCts} onChange={(event) => setOutputCts(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Reject CTS</label>
            <Input value={rejectCts} onChange={(event) => setRejectCts(event.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Wastage CTS</label>
            <Input value={wastageCts} onChange={(event) => setWastageCts(event.target.value)} />
          </div>
          <div className="md:col-span-4">
            <label className="text-xs uppercase text-slate-500">Notes</label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={addEvent}>
            Add Stage Event
          </Button>
        </div>
      </div>

      <DataTable headers={headers} rows={rows} />
    </div>
  );
};

export default ProductionPage;
