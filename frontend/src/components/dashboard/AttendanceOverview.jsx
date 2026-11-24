import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import ChartTooltip from './ChartTooltip';

// Status colours are reserved for state, and always paired with a text label.
const SERIES = [
  { key: 'present', label: 'Present', color: '#0ca30c' },
  { key: 'late', label: 'Late', color: '#fab219' },
  { key: 'absent', label: 'Absent', color: '#d03b3b' },
];
const NOT_MARKED = '#d6d5cd';

function AttendanceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltip
      title={p.date}
      rows={SERIES.map((s) => ({ label: s.label, value: p[s.key], color: s.color }))}
    />
  );
}

export default function AttendanceOverview({ attendance, activeEmployees }) {
  const { today, last7Days, attendanceRate } = attendance;
  const segments = [
    ...SERIES.map((s) => ({ ...s, value: today[s.key] })),
    { key: 'notMarked', label: 'Not marked', color: NOT_MARKED, value: today.notMarked },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Attendance overview" description="Today's status and the past 7 days" />

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="tabular text-3xl leading-none font-bold tracking-tight text-ink">{attendanceRate}%</p>
          <p className="mt-1.5 text-[13px] text-muted">
            attending today · {today.present + today.late} of {activeEmployees} active
          </p>
        </div>
      </div>

      {/* Today's composition: stacked bar with a 2px surface gap between segments */}
      <div
        className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}
      >
        {total === 0 ? (
          <div className="h-full w-full bg-line" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => <div key={s.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flex: s.value, background: s.color }} />)
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
            <span className="tabular font-semibold text-ink">{s.value}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 min-h-[190px] flex-1" role="img" aria-label="Present, late and absent employees for each of the last 7 days">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#e8e7e1" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d6d5cd' }} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
            <Tooltip content={<AttendanceTooltip />} cursor={{ fill: 'rgba(26,26,25,0.04)' }} />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="a"
                fill={s.color}
                stroke="#ffffff"
                strokeWidth={2}
                radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
