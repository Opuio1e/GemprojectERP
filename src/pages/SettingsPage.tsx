import type { ChangeEvent } from 'react';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import { deleteRow } from '../db';
import { useSupabaseTable } from '../db/useSupabaseTable';
import type { AuditLog } from '../types';
import { exportWorkbook, importWorkbook } from '../utils/importExport';

const SettingsPage = () => {
  const { data: audits, refresh: refreshAudits } = useSupabaseTable<AuditLog>('audit_log');

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importWorkbook(file);
    await refreshAudits();
  };

  const deleteAuditEntry = async (id: string) => {
    await deleteRow('audit_log', id);
    await refreshAudits();
  };

  const headers = ['Timestamp', 'Entity', 'Action', 'Summary', 'Delete'];

  const rows = (audits ?? []).map((entry) => [
    new Date(entry.timestamp).toLocaleString(),
    `${entry.entityType} (${entry.entityId})`,
    entry.action,
    entry.summary,
    <Button
      key={`${entry.id}-delete`}
      variant="ghost"
      className="text-red-500 hover:text-red-600"
      onClick={() => deleteAuditEntry(entry.id)}
    >
      Delete
    </Button>
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Settings & Data Management</h1>
        <p className="text-sm text-slate-500">
          Import/export workbook data and review audit history.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Import Workbook
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          </label>
          <Button variant="secondary" onClick={exportWorkbook}>
            Export Workbook
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Audit Log</h2>
        <DataTable headers={headers} rows={rows} />
      </div>
    </div>
  );
};

export default SettingsPage;
