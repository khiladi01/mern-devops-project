import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import ChartTooltip from './ChartTooltip';

const LINE = '#2a78d6';

function GrowthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltip
      title={p.month}
      rows={[
        { label: 'Headcount', value: p.total, color: LINE },
        { label: 'Joined', value: `+${p.added}` },
      ]}
    />
  );
}

export default function GrowthChart({ data }) {
  const first = data[0]?.total ?? 0;
  const last = data[data.length - 1]?.total ?? 0;
  const added = last - first;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Employee growth"
        description={`Headcount over the last 12 months${added > 0 ? ` · ${added} net new` : ''}`}
      />
      <div className="min-h-[260px] flex-1" role="img" aria-label={`Headcount grew from ${first} to ${last} over twelve months`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="#e8e7e1" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d6d5cd' }} tickMargin={8} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
            <Tooltip content={<GrowthTooltip />} cursor={{ stroke: '#d6d5cd', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={LINE}
              strokeWidth={2}
              fill={LINE}
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: LINE }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
