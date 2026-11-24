import { Building2, CalendarCheck, UserCheck, UsersRound } from 'lucide-react';
import { dashboardApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { localToday } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ErrorState, Skeleton } from '../components/ui/States';
import StatCard from '../components/dashboard/StatCard';
import GrowthChart from '../components/dashboard/GrowthChart';
import DepartmentChart from '../components/dashboard/DepartmentChart';
import AttendanceOverview from '../components/dashboard/AttendanceOverview';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import RecentEmployees from '../components/dashboard/RecentEmployees';

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

function ChartSkeleton({ className = '' }) {
  return (
    <Card className={className}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-6 h-[220px] w-full" />
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardApi.stats(localToday()), []);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const header = <PageHeader title="Dashboard" description={`Welcome back, ${firstName}. Here's how your team is doing today.`} />;

  if (error && !data) {
    return (
      <>
        {header}
        <Card padded={false}>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </>
    );
  }

  const totals = data?.totals;
  const joinedThisMonth = data?.growth.at(-1)?.added ?? 0;
  const largest = data?.departmentDistribution[0];

  return (
    <>
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Total employees"
          value={totals?.employees}
          hint={`${joinedThisMonth} joined this month`}
          icon={UsersRound}
        />
        <StatCard
          loading={loading}
          label="Active employees"
          value={totals?.activeEmployees}
          hint={`${pct(totals?.activeEmployees, totals?.employees)}% of the workforce`}
          icon={UserCheck}
          tint="good"
        />
        <StatCard
          loading={loading}
          label="Departments"
          value={totals?.departments}
          hint={largest ? `Largest: ${largest.name} (${largest.count})` : 'No departments yet'}
          icon={Building2}
          tint="violet"
        />
        <StatCard
          loading={loading}
          label="Present today"
          value={totals?.presentToday}
          hint={`${data?.attendance.attendanceRate ?? 0}% of active employees`}
          icon={CalendarCheck}
          tint="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {loading ? (
          <>
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <div className="flex lg:col-span-2 [&>*]:flex-1">
              <GrowthChart data={data.growth} />
            </div>
            <DepartmentChart data={data.departmentDistribution} />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {loading ? (
          <>
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <div className="flex lg:col-span-2 [&>*]:flex-1">
              <AttendanceOverview attendance={data.attendance} activeEmployees={totals.activeEmployees} />
            </div>
            <ActivityFeed items={data.recentActivity} />
          </>
        )}
      </div>

      <div className="mt-4">
        {loading ? <ChartSkeleton /> : <RecentEmployees employees={data.recentEmployees} />}
      </div>
    </>
  );
}
