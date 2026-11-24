import { Menu } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { formatLongDate, localToday } from '../../utils/format';

const HEALTH = {
  checking: { label: 'Checking system', dot: 'bg-muted', text: 'text-muted' },
  healthy: { label: 'All systems operational', dot: 'bg-good', text: 'text-good-ink' },
  degraded: { label: 'Database unavailable', dot: 'bg-warn', text: 'text-warn-ink' },
  offline: { label: 'API unreachable', dot: 'bg-critical', text: 'text-critical-ink' },
};

export default function Topbar({ onOpenMobile }) {
  const status = useHealth();
  const h = HEALTH[status];

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-8">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="-ml-1.5 rounded-lg p-2 text-ink-2 hover:bg-black/5 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <p className="hidden text-sm font-medium text-ink-2 sm:block">{formatLongDate(localToday())}</p>

      <div
        role="status"
        className={`ml-auto flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold ${h.text}`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'healthy' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-50" />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${h.dot}`} />
        </span>
        {h.label}
      </div>
    </header>
  );
}
