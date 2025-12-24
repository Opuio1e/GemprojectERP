import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../components/Button';
import { db } from '../db';
import { exportCsvReport, exportWorkbook } from '../utils/importExport';

const reportCards = [
  {
    title: 'Memo Report',
    description: 'Stage-wise memo movement with open/closed status.',
    key: 'memo'
  },
  {
    title: 'Process Report',
    description: 'Production stage yield and wastage insights.',
    key: 'process'
  },
  {
    title: 'Wastage Report',
    description: 'Aggregate wastage by lot and stage.',
    key: 'wastage'
  },
  {
    title: 'Cashbook Report',
    description: 'Debit/credit ledger totals with balances.',
    key: 'cashbook'
  }
];

const ReportsPage = () => {
  const memos = useLiveQuery(() => db.memos.toArray(), []);
  const production = useLiveQuery(() => db.productionStages.toArray(), []);
  const ledger = useLiveQuery(() => db.ledgerEntries.toArray(), []);

  const handleExport = async (key: string) => {
    if (key === 'memo') {
      await exportCsvReport('memo-report', memos ?? []);
      return;
    }
    if (key === 'process') {
      await exportCsvReport('process-report', production ?? []);
      return;
    }
    if (key === 'wastage') {
      const wastageRows = (production ?? []).map((stage) => ({
        lotId: stage.lotId,
        stage: stage.stage,
        wastageCts: stage.wastageCts ?? 0,
        rejectCts: stage.rejectCts ?? 0,
        date: stage.date
      }));
      await exportCsvReport('wastage-report', wastageRows);
      return;
    }
    if (key === 'cashbook') {
      await exportCsvReport('cashbook-report', ledger ?? []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Reporting</h1>
        <p className="text-sm text-slate-500">
          Export operational data and reports to CSV/XLSX or print-ready views.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={exportWorkbook}>
            Export Workbook (XLSX)
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Print / PDF View
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportCards.map((report) => (
          <div key={report.title} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{report.description}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => handleExport(report.key)}>
                Export CSV
              </Button>
              <Button variant="ghost" onClick={() => window.print()}>
                View Report
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
