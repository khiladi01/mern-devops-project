import { ChevronLeft, ChevronRight } from 'lucide-react';

const pageList = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap-' + p, p] : [p]));
};

const btn =
  'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40';

export default function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:flex-row">
      <p className="text-[13px] text-muted">
        Showing <span className="font-semibold text-ink">{from}</span>–<span className="font-semibold text-ink">{to}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" className={`${btn} text-ink-2 hover:bg-black/5`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageList(page, pages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-muted" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${p === page ? 'bg-brand-600 text-white' : 'text-ink-2 hover:bg-black/5'}`}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={`${btn} text-ink-2 hover:bg-black/5`} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
