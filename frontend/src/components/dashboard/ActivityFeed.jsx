import { CalendarCheck, KeyRound, Network, Server, UserRound } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/States';
import { relativeTime } from '../../utils/format';

const TYPES = {
  employee: { icon: UserRound, tint: 'bg-brand-50 text-brand-600' },
  department: { icon: Network, tint: 'bg-[#ebe8fb] text-[#4a3aa7]' },
  attendance: { icon: CalendarCheck, tint: 'bg-good-tint text-good-ink' },
  auth: { icon: KeyRound, tint: 'bg-warn-tint text-warn-ink' },
  system: { icon: Server, tint: 'bg-black/5 text-ink-2' },
};

export default function ActivityFeed({ items }) {
  return (
    <Card className="h-full">
      <CardHeader title="Recent activity" description="What has changed lately" />
      {items.length === 0 ? (
        <EmptyState title="Nothing yet" description="Changes to employees, departments and attendance show up here." />
      ) : (
        <ol className="relative space-y-5">
          <span className="absolute top-2 bottom-2 left-[17px] w-px bg-line" aria-hidden="true" />
          {items.map((a) => {
            const { icon: Icon, tint } = TYPES[a.type] || TYPES.system;
            return (
              <li key={a._id} className="relative flex gap-3.5">
                <span className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-surface ${tint}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] leading-snug font-medium text-ink">{a.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {relativeTime(a.createdAt)}
                    {a.actor && a.actor !== 'System' ? ` · ${a.actor}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
