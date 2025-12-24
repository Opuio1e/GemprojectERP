import type { ReactNode } from 'react';

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
}

const DataTable = ({ headers, rows }: DataTableProps) => (
  <div className="overflow-auto rounded-lg border border-border bg-white shadow-sm">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-3 py-3 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500">
              No records found.
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
