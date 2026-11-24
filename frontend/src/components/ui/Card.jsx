export function Card({ className = '', padded = true, children, ...props }) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface shadow-card ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
