import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Hash, Mail, Pencil, Phone, Trash2, UserRoundX } from 'lucide-react';
import { attendanceApi, departmentsApi, employeesApi } from '../api/services';
import { getErrorMessage } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { formatDate, formatTime, workedHours } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { AttendanceBadge, EmploymentBadge } from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import EmployeeForm from '../components/employees/EmployeeForm';

// "1 yr 3 mo" style tenure, based on the joining date.
const tenure = (joiningDate) => {
  const start = new Date(joiningDate);
  const now = new Date();
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  if (months < 0) return 'Starts soon';
  if (months < 1) return 'Less than a month';
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
};

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words text-ink">{children}</dd>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/50 p-4">
      <p className="tabular text-2xl leading-none font-bold text-ink">{value}</p>
      <p className={`mt-2 text-[13px] font-semibold ${tone}`}>{label}</p>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: employee, loading, error, reload } = useFetch(() => employeesApi.get(id), [id]);
  const { data: attendance } = useFetch(() => attendanceApi.list({ employee: id, limit: 10 }), [id]);
  const { data: departments } = useFetch(() => departmentsApi.list(), []);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const back = (
    <Link to="/employees" className="mb-5 inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All employees
    </Link>
  );

  if (error && !employee) {
    const notFound = /not found|invalid/i.test(error);
    return (
      <>
        {back}
        <Card padded={false}>
          {notFound ? (
            <EmptyState icon={UserRoundX} title="Employee not found" description="They may have been deleted, or the link is wrong." />
          ) : (
            <ErrorState message={error} onRetry={reload} />
          )}
        </Card>
      </>
    );
  }

  if (loading && !employee) {
    return (
      <>
        {back}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><Skeleton className="mx-auto h-24 w-24 rounded-full" /><Skeleton className="mx-auto mt-4 h-5 w-40" /><Skeleton className="mt-8 h-32 w-full" /></Card>
          <Card className="lg:col-span-2"><Skeleton className="h-64 w-full" /></Card>
        </div>
      </>
    );
  }

  const summary = attendance?.summary || { present: 0, late: 0, absent: 0 };
  const records = attendance?.data || [];

  const remove = async () => {
    setDeleting(true);
    try {
      await employeesApi.remove(employee._id);
      toast.success(`${employee.fullName} was deleted.`);
      navigate('/employees', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <>
      {back}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={employee.fullName} src={employee.profileImage} size="xl" />
            <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">{employee.fullName}</h1>
            <p className="mt-0.5 text-sm text-ink-2">{employee.position}</p>
            <div className="mt-3">
              <EmploymentBadge status={employee.status} />
            </div>
            <div className="mt-5 flex w-full gap-2">
              <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)} className="flex-1">
                Edit
              </Button>
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmDelete(true)} className="flex-1 hover:border-critical/40 hover:bg-critical-tint hover:text-critical-ink">
                Delete
              </Button>
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-line pt-6">
            <InfoRow icon={Hash} label="Employee ID">
              <span className="tabular">{employee.employeeId}</span>
            </InfoRow>
            <InfoRow icon={Mail} label="Email">
              <a href={`mailto:${employee.email}`} className="text-brand-700 hover:underline">{employee.email}</a>
            </InfoRow>
            <InfoRow icon={Phone} label="Phone">
              <a href={`tel:${employee.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">{employee.phone}</a>
            </InfoRow>
            <InfoRow icon={Building2} label="Department">
              <Link to={`/employees?department=${employee.department?._id}`} className="text-brand-700 hover:underline">
                {employee.department?.name}
              </Link>
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Joined">
              {formatDate(employee.joiningDate)} <span className="font-normal text-muted">· {tenure(employee.joiningDate)}</span>
            </InfoRow>
          </dl>
        </Card>

        {/* Attendance */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardHeader title="Attendance" description="All-time summary and the 10 most recent records" />
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile label="Present" value={summary.present} tone="text-good-ink" />
              <SummaryTile label="Late" value={summary.late} tone="text-warn-ink" />
              <SummaryTile label="Absent" value={summary.absent} tone="text-critical-ink" />
            </div>
          </div>

          {records.length === 0 ? (
            <EmptyState title="No attendance recorded" description="Attendance records will appear here once they are added." />
          ) : (
            <div className="mt-5 overflow-x-auto border-t border-line">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-canvas/60 text-[13px] text-ink-2">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold sm:px-6">Date</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Check-in</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Check-out</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td className="tabular px-5 py-3 whitespace-nowrap text-ink sm:px-6">{formatDate(r.date)}</td>
                      <td className="px-5 py-3"><AttendanceBadge status={r.status} /></td>
                      <td className="tabular px-5 py-3 text-ink-2">{formatTime(r.checkIn)}</td>
                      <td className="tabular px-5 py-3 text-ink-2">{formatTime(r.checkOut)}</td>
                      <td className="tabular px-5 py-3 text-ink-2">{workedHours(r.checkIn, r.checkOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <EmployeeForm
        open={editing}
        employee={employee}
        departments={departments || []}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          reload();
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete employee"
        message={`Delete ${employee.fullName} (${employee.employeeId})? Their attendance history will be removed too. This can't be undone.`}
        confirmLabel="Delete employee"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
