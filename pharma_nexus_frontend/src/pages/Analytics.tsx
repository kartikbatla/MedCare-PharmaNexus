import { BarChart3, TrendingUp, Timer, PiggyBank, ScanLine, Gauge, Zap } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { chartColors, chartTooltipStyle, axisStyle } from '../components/charts/ChartCard';
import {
  monthlySpend,
  supplierPerformance,
  cycleTime,
  invoiceAnomalyTrend,
} from '../data/mockData';
import { formatINR } from '../lib/utils';
import { useState } from 'react';
import SegmentControl from '../components/ui/SegmentControl';

const automationPie = [
  { name: 'Automated', value: 78 },
  { name: 'Manual', value: 22 },
];

const anomalyPie = [
  { name: 'Price', value: 42 },
  { name: 'Quantity', value: 27 },
  { name: 'Duplicate', value: 18 },
  { name: 'Supplier', value: 13 },
];

const kpiRow = [
  { label: 'Monthly Spend', value: '₹18.1L', delta: '+7.7%', up: true, icon: TrendingUp },
  { label: 'Automation Rate', value: '78%', delta: '+9% QoQ', up: true, icon: Gauge },
  { label: 'Cost Savings', value: '₹6.4L', delta: 'FY run-rate', up: true, icon: PiggyBank },
  { label: 'Avg Cycle Time', value: '13.1 days', delta: '−31% YoY', up: false, icon: Timer },
];

export default function Analytics() {
  const [view, setView] = useState<'3m' | '6m'>('6m');
  const spend = view === '3m' ? monthlySpend.slice(-3) : monthlySpend;

  return (
    <div className="space-y-6">
      <PageHeader
        title="P2P Analytics · Control Tower"
        subtitle="End-to-end procure-to-pay performance, savings and risk in one view"
        action={
          <SegmentControl
            options={[
              { id: '3m', label: '3M' },
              { id: '6m', label: '6M' },
            ]}
            value={view}
            onChange={setView}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiRow.map((k) => (
          <div key={k.label} className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-brand-charcoal/55">{k.label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
                <k.icon size={15} />
              </span>
            </div>
            <p className="mt-2 text-[24px] leading-none font-semibold tracking-tight text-brand-charcoal tabular-nums">
              {k.value}
            </p>
            <p className={`mt-2.5 text-xs font-medium ${k.up ? 'text-status-success' : 'text-status-danger'}`}>
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Procurement Spend"
            subtitle="Total vs automated spend"
            icon={<BarChart3 size={15} />}
          />
          <div className="h-[280px] px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend} margin={{ top: 8, right: 8, left: -6, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: unknown) => formatINR(Number(v))} />
                <Bar dataKey="spend" name="Total spend" fill={chartColors.light} radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Bar dataKey="automated" name="Automated" fill={chartColors.navy} radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Automation Rate"
            subtitle="Zero-touch P2P transactions"
            icon={<Gauge size={15} />}
          />
          <div className="px-5 pb-5">
            <div className="relative mx-auto h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={automationPie} dataKey="value" innerRadius={62} outerRadius={82} paddingAngle={3} startAngle={90} endAngle={-270} strokeWidth={0}>
                    <Cell fill={chartColors.navy} />
                    <Cell fill="rgba(15,34,58,0.08)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-semibold tracking-tight text-brand-charcoal tabular-nums">78%</p>
                <p className="text-xs text-brand-charcoal/50">automated</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-5">
              <span className="flex items-center gap-1.5 text-xs text-brand-charcoal/60">
                <span className="h-2 w-2 rounded-full bg-brand-navy" /> Automated
              </span>
              <span className="flex items-center gap-1.5 text-xs text-brand-charcoal/60">
                <span className="h-2 w-2 rounded-full bg-brand-navy/10" /> Manual
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Procurement Cycle Time"
            subtitle="Request → PO → Receipt → Invoice → Payment (days)"
            icon={<Timer size={15} />}
          />
          <div className="h-[260px] px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="step" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: unknown) => `${Number(v)} days`} />
                <Line type="monotone" dataKey="days" name="Days" stroke={chartColors.navy} strokeWidth={2.5} dot={{ r: 4, fill: chartColors.navy, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Supplier Performance"
            subtitle="Composite score by supplier"
            icon={<Zap size={15} />}
          />
          <div className="h-[260px] px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierPerformance} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={92} tick={{ ...axisStyle, fill: 'rgba(28,28,28,0.7)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="reliability" name="Reliability" stackId="a" fill={chartColors.light} maxBarSize={14} />
                <Bar dataKey="onTime" name="On-time" stackId="a" fill={chartColors.muted} maxBarSize={14} />
                <Bar dataKey="quality" name="Quality" stackId="a" fill={chartColors.navy} maxBarSize={14} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Invoice Anomalies"
            subtitle="Detected, by type — last 6 months"
            icon={<ScanLine size={15} />}
          />
          <div className="px-5 pb-2">
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={invoiceAnomalyTrend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="anomalies" name="Anomalies" stroke={chartColors.danger} strokeWidth={2.5} dot={{ r: 3, fill: chartColors.danger }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {anomalyPie.map((a) => (
                <div key={a.name} className="flex items-center justify-between rounded-lg bg-brand-navy/[0.03] px-3 py-2">
                  <span className="text-xs text-brand-charcoal/60">{a.name}</span>
                  <span className="text-sm font-semibold text-brand-charcoal tabular-nums">{a.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-brand-muted/30 bg-gradient-to-br from-white to-brand-muted/[0.04]">
          <div className="flex flex-wrap items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy text-white">
              <PiggyBank size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-charcoal">Cost Savings</p>
              <p className="text-[13px] text-brand-charcoal/55">
                Transfer-first replenishment, negotiated pricing and anomaly prevention
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-status-success tabular-nums">₹6.4L</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-brand-navy/8 border-t border-brand-navy/8">
            {[
              ['₹3.4L', 'Transfers over purchases'],
              ['₹1.8L', 'Price discrepancy caught'],
              ['₹1.2L', 'FEFO write-off avoided'],
            ].map(([v, l]) => (
              <div key={l} className="px-4 py-3 text-center">
                <p className="text-sm font-semibold text-brand-charcoal tabular-nums">{v}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-brand-charcoal/50">{l}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Automation Coverage"
            subtitle="Share of transactions handled without human touch"
            icon={<Gauge size={15} />}
          />
          <div className="space-y-3.5 px-5 pb-5">
            {[
              ['Invoice OCR extraction', 98, 'success'],
              ['3-Way matching', 94, 'success'],
              ['PO creation from recommendations', 86, 'muted'],
              ['Demand → replenishment', 82, 'muted'],
              ['Payment approval', 71, 'warning'],
            ].map(([label, pct, tone]) => (
              <div key={label as string}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-charcoal/75">{label}</span>
                  <span className="font-semibold text-brand-charcoal tabular-nums">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-navy/8">
                  <div
                    className={`h-full rounded-full ${tone === 'success' ? 'bg-status-success' : tone === 'warning' ? 'bg-status-warning' : 'bg-brand-muted'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
