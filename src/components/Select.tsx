import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={clsx(
      'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export default Select;
