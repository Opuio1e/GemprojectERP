import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-blue-700',
  secondary: 'bg-white border border-border text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
};

const Button = ({
  variant = 'secondary',
  icon,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={clsx(
      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition',
      variantStyles[variant],
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export default Button;
