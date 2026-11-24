import { Card } from '../ui/Card';
import { Skeleton } from '../ui/States';

const TINTS = {
  brand: 'bg-brand-50 text-brand-600',
  good: 'bg-good-tint text-good-ink',
  violet: 'bg-[#ebe8fb] text-[#4a3aa7]',
  amber: 'bg-warn-tint text-warn-ink',
};

export default function StatCard({ label, value, hint, icon: Icon, tint = 'brand', loading }) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-pop" padded={false}>
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink-2">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="tabular mt-2 text-[28px] leading-none font-bold tracking-tight text-ink">{value}</p>
          )}
          {loading ? <Skeleton className="mt-3 h-3.5 w-28" /> : <p className="mt-2.5 truncate text-[13px] text-muted">{hint}</p>}
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TINTS[tint]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
