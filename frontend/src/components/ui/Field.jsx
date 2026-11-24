import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const control =
  'w-full rounded-xl border bg-surface text-sm text-ink placeholder:text-muted transition focus:outline-none focus:ring-4 disabled:bg-canvas disabled:text-muted';
const ok = 'border-line-strong focus:border-brand-500 focus:ring-brand-500/15';
const bad = 'border-critical focus:border-critical focus:ring-critical/15';

export function Field({ label, htmlFor, error, hint, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-ink">
          {label}
          {required && (
            <span className="text-critical" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-critical-ink">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ invalid, icon: Icon, className = '', ...props }, ref) {
  if (!Icon) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={`${control} h-10 px-3.5 ${invalid ? bad : ok} ${className}`} {...props} />;
  }
  return (
    <div className={`relative ${className}`}>
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input ref={ref} aria-invalid={invalid || undefined} className={`${control} h-10 pr-3.5 pl-10 ${invalid ? bad : ok}`} {...props} />
    </div>
  );
});

export const Select = forwardRef(function Select({ invalid, className = '', children, ...props }, ref) {
  return (
    <div className={`relative ${className}`}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${control} h-10 appearance-none pr-9 pl-3.5 ${invalid ? bad : ok}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ invalid, className = '', ...props }, ref) {
  return (
    <textarea ref={ref} aria-invalid={invalid || undefined} rows={3} className={`${control} resize-y px-3.5 py-2.5 ${invalid ? bad : ok} ${className}`} {...props} />
  );
});
