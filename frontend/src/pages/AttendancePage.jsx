import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
import { attendanceApi } from '../api/services';
import { useFetch } from '../hooks/useFetch';
import { formatDate, formatLongDate, formatTime, localToday, shiftDate, workedHours } from '../utils/format';
import { ATTENDANCE_STATUSES } from '../utils/constants';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { AttendanceBadge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Field';
import Pagination from '../components/ui/Pagination';
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States';
import AttendanceForm from '../components/attendance/AttendanceForm';

const PAGE_SIZE = 15;
const MODES = [
  { value: 'day', label: 'Single day' },
  { value: 'range', label: 'Date range' },
];

const SUMMARY = [
  { key: 'present', label: 'Present', tone: 'text-good-ink', dot: 'bg-good' },
  { key: 'late', label: 'Late', tone: 'text-warn-ink', dot: 'bg-warn' },
  { key: 'absent', label: 'Absent', tone: 'text-critical-ink', dot: 'bg-critical' },
];

export default function AttendancePage() {
  const today = localToday();
  const [mode, setMode] = useState('day');
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState(shiftDate(today, -6));
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState({ open: false, record: null });

  const rangeInvalid = mode === 'range' && from && to && from > to;
  const dateParams = mode === 'day' ? { date: date || undefined } : { from: from || undefined, to: to || undefined };

  const { data, loading, error, reload } = useFetch(
    () => (rangeInvalid ? Promise.resolve(null) : attendanceApi.list({ ...dateParams, status: status || undefined, page, limit: PAGE_SIZE })),
    [mode, date, from, to, status, page]
  );

  const rows = data?.data || [];
  const summary = data?.summary || { present: 0, late: 0, absent: 0 };
  const pagination = data?.pagination;
  const total = summary.present + summary.late + summary.absent;

  const resetPage = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  const heading =
    mode === 'day'
      ? date
        ? date === today
          ? `Today, ${formatLongDate(date)}`
          : formatLongDate(date)
        : 'All dates'
      : `${from ? formatDate(from) : 'Beginning'} to ${to ? formatDate(to) : 'now'}`;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Daily check-ins, absences and history for every employee."
        actions={
          <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>
            Record attendance
          </Button>
        }
      />

      {/* Filters */}
      <Card padded={false} className="mb-4">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div role="group" aria-label="Date filter mode" className="inline-flex shrink-0 self-start rounded-xl bg-canvas p-1 sm:self-auto">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMode(m.value);
                    setPage(1);
                  }}
                  aria-pressed={mode === m.value}
                  className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                    mode === m.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'day' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous day"
                  disabled={!date}
                  onClick={() => resetPage(setDate)(shiftDate(date, -1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-ink-2 shadow-sm transition-colors hover:bg-canvas disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <Input type="date" aria-label="Attendance date" value={date} onChange={(e) => resetPage(setDate)(e.target.value)} className="w-44" />
                <button
                  type="button"
                  aria-label="Next day"
                  disabled={!date || date >= today}
                  onClick={() => resetPage(setDate)(shiftDate(date, 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-ink-2 shadow-sm transition-colors hover:bg-canvas disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {date !== today && (
                  <Button variant="ghost" size="sm" onClick={() => resetPage(setDate)(today)}>
                    Today
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => resetPage(setFrom)(e.target.value)} className="w-44" />
                <span className="text-sm text-muted">to</span>
                <Input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => resetPage(setTo)(e.target.value)} className="w-44" />
              </div>
            )}
          </div>

          <Select aria-label="Filter by status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)} className="lg:w-44">
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        {rangeInvalid && (
          <p role="alert" className="border-t border-line bg-critical-tint px-5 py-2.5 text-[13px] font-medium text-critical-ink">
            The start date must be on or before the end date.
          </p>
        )}
      </Card>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-[15px] font-semibold text-ink">{heading}</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {SUMMARY.map((s) => (
              <li key={s.key} className={`flex items-center gap-2 text-[13px] font-semibold ${s.tone}`}>
                <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                <span className="tabular">{summary[s.key]}</span> {s.label.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (loading && !data) ? (
          <TableSkeleton rows={8} cols={6} />
        ) : rangeInvalid ? (
          <EmptyState icon={CalendarCheck} title="Fix the date range" description="Choose a start date that is on or before the end date." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={total === 0 ? 'No attendance recorded' : 'No records with this status'}
            description={total === 0 ? 'Nothing has been recorded for this period yet.' : 'Try another status or clear the filter.'}
            action={
              total === 0 ? (
                <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>
                  Record attendance
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => resetPage(setStatus)('')}>
                  Show all statuses
                </Button>
              )
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-line bg-canvas/60 text-[13px] text-ink-2">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold sm:px-6">Employee</th>
                    {mode === 'range' && <th scope="col" className="px-5 py-3 font-semibold">Date</th>}
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Check-in</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Check-out</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Hours</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Notes</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r._id} className="transition-colors hover:bg-canvas/60">
                      <td className="px-5 py-3 sm:px-6">
                        <Link to={`/employees/${r.employee._id}`} className="group flex items-center gap-3">
                          <Avatar name={r.employee.fullName} src={r.employee.profileImage} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink group-hover:text-brand-700">{r.employee.fullName}</span>
                            <span className="block truncate text-xs text-muted">{r.employee.department?.name}</span>
                          </span>
                        </Link>
                      </td>
                      {mode === 'range' && <td className="tabular px-5 py-3 whitespace-nowrap text-ink-2">{formatDate(r.date)}</td>}
                      <td className="px-5 py-3"><AttendanceBadge status={r.status} /></td>
                      <td className="tabular px-5 py-3 whitespace-nowrap text-ink-2">{formatTime(r.checkIn)}</td>
                      <td className="tabular px-5 py-3 whitespace-nowrap text-ink-2">{formatTime(r.checkOut)}</td>
                      <td className="tabular px-5 py-3 whitespace-nowrap text-ink-2">{workedHours(r.checkIn, r.checkOut)}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-[13px] text-muted" title={r.notes || undefined}>{r.notes || '-'}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setFormState({ open: true, record: r })}
                          aria-label={`Edit attendance for ${r.employee.fullName}`}
                          title="Edit"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} />}
          </div>
        )}
      </Card>

      <AttendanceForm
        open={formState.open}
        record={formState.record}
        defaultDate={mode === 'day' && date ? date : today}
        onClose={() => setFormState({ open: false, record: null })}
        onSaved={() => {
          setFormState({ open: false, record: null });
          reload();
        }}
      />
    </>
  );
}
