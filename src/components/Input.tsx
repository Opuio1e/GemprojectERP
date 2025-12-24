import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={clsx(
      'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none',
      className
    )}
    {...props}
  />
);

export default Input;
