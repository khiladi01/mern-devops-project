import { ATTENDANCE_STATUSES, EMPLOYMENT_STATUSES } from '../../utils/constants';

const TONES = {
  good: 'bg-good-tint text-good-ink',
  warning: 'bg-warn-tint text-warn-ink',
  critical: 'bg-critical-tint text-critical-ink',
  info: 'bg-brand-50 text-brand-700',
  neutral: 'bg-black/5 text-ink-2',
};

export function Badge({ tone = 'neutral', dot = true, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

const lookup = (list, value) => list.find((s) => s.value === value);

export function EmploymentBadge({ status }) {
  const s = lookup(EMPLOYMENT_STATUSES, status);
  return <Badge tone={s?.tone}>{s?.label || status}</Badge>;
}

export function AttendanceBadge({ status }) {
  const s = lookup(ATTENDANCE_STATUSES, status);
  return <Badge tone={s?.tone}>{s?.label || status}</Badge>;
}
