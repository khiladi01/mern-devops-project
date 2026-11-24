import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/States';
import { CHART_COLORS } from '../../utils/constants';
import ChartTooltip from './ChartTooltip';

const MAX_SLICES = 7;

// Keeps the donut legible: the long tail folds into one neutral "Other" slice.
const prepare = (rows) => {
  const head = rows.slice(0, MAX_SLICES).map((r, i) => ({ ...r, fill: CHART_COLORS[i] }));
  const rest = rows.slice(MAX_SLICES);
  if (rest.length) head.push({ id: 'other', name: 'Other', count: rest.reduce((s, r) => s + r.count, 0), fill: '#b9b8b0' });
  return head;
};

function DeptTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltip
      title={p.name}
      rows={[
        { label: 'Employees', value: p.count, color: p.fill },
        { label: 'Share', value: `${Math.round((p.count / total) * 100)}%` },
      ]}
    />
  );
}

export default function DepartmentChart({ data }) {
  const rows = prepare(data);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <Card className="h-full">
      <CardHeader title="Department distribution" description="Employees by department" />
      {total === 0 ? (
        <EmptyState title="No employees yet" description="Add employees to see how departments are staffed." />
      ) : (
        <>
          <div className="relative mx-auto h-[190px] w-full max-w-[220px]" role="img" aria-label={`Employees across ${rows.length} departments, ${total} in total`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DeptTooltip total={total} />} />
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="name"
                  innerRadius="66%"
                  outerRadius="100%"
                  paddingAngle={0}
                  stroke="#ffffff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="tabular text-2xl leading-none font-bold text-ink">{total}</p>
                <p className="mt-1 text-xs text-muted">employees</p>
              </div>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: r.fill }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-ink-2">{r.name}</span>
                <span className="tabular font-semibold text-ink">{r.count}</span>
                <span className="tabular w-10 text-right text-muted">{Math.round((r.count / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
