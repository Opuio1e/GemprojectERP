import type { ReactNode } from 'react';

const SummaryCard = ({ title, value, footer }: { title: string; value: ReactNode; footer?: string }) => (
  <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
    <p className="text-xs uppercase text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {footer ? <p className="mt-2 text-xs text-slate-500">{footer}</p> : null}
  </div>
);

export default SummaryCard;
