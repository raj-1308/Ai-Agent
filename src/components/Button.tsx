import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm';
    const styles =
      variant === 'primary'
        ? 'bg-electric text-white hover:bg-electric-soft shadow-[0_0_0_1px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]'
        : variant === 'secondary'
        ? 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
        : 'bg-transparent text-white/80 hover:text-white';

    return (
      <button ref={ref} className={`${base} ${styles} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
