/** Shared tooltip surface for all dashboard charts. */
export default function ChartTooltip({ title, rows = [] }) {
  return (
    <div className="min-w-36 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop">
      {title && <p className="mb-1.5 text-xs font-semibold text-ink">{title}</p>}
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-2 text-ink-2">
              {row.color && <span className="h-2 w-2 rounded-sm" style={{ background: row.color }} aria-hidden="true" />}
              {row.label}
            </span>
            <span className="tabular font-semibold text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
