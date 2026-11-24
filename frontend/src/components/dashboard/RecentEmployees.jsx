import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import Avatar from '../ui/Avatar';
import { EmploymentBadge } from '../ui/Badge';
import { EmptyState } from '../ui/States';
import { formatDate } from '../../utils/format';

export default function RecentEmployees({ employees }) {
  return (
    <Card padded={false}>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardHeader
          title="Recent additions"
          description="The latest people to join the company"
          action={
            <Link to="/employees" className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold text-brand-700 hover:bg-brand-50">
              View all
            </Link>
          }
        />
      </div>
      {employees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No employees yet"
          description="New hires will appear here as soon as you add them."
        />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {employees.map((e) => (
            <li key={e._id}>
              <Link
                to={`/employees/${e._id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/70 sm:px-6"
              >
                <Avatar name={e.fullName} src={e.profileImage} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{e.fullName}</p>
                  <p className="truncate text-[13px] text-muted">{e.position}</p>
                </div>
                <p className="hidden w-36 truncate text-[13px] text-ink-2 md:block">{e.department?.name}</p>
                <p className="tabular hidden w-28 text-[13px] text-ink-2 sm:block">{formatDate(e.joiningDate)}</p>
                <EmploymentBadge status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
