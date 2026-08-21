"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  analyticsKpis,
  faultBreakdown,
  threePlScorecard,
  weeklyRecovery
} from "@/lib/analytics-data";
import { deductions, retailers } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#e2e8f0"
};

export default function AnalyticsPage() {
  const retailerAtStake = retailers.map(retailer => ({
    name: retailer.name,
    value: deductions
      .filter(deduction => deduction.retailerId === retailer.id)
      .reduce((sum, deduction) => sum + Math.abs(deduction.amount), 0)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Recovery Analytics
        </h1>
        <p className="mt-1 text-slate-400">
          Where money is lost, who causes it, and how fast we recover.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-sm text-emerald-300">Net Recovery Rate</p>
          <p className="mt-2 text-3xl font-bold">
            {Math.round(analyticsKpis.recoveryRate * 100)}%
          </p>
          <p className="mt-1 text-sm text-emerald-300/80">
            of disputed dollars recovered
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
          <p className="text-sm text-blue-300">MTD Recovered</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(analyticsKpis.mtdRecovered)}
          </p>
          <p className="mt-1 text-sm text-blue-300/80">
            including 3PL back-charges
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Avg Dispute Cycle</p>
          <p className="mt-2 text-3xl font-bold">
            {analyticsKpis.avgCycleDays} days
          </p>
          <p className="mt-1 text-sm text-slate-500">
            vs 22 days industry manual average
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-sm text-red-300">Expiring Soon</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(analyticsKpis.expiringSoon)}
          </p>
          <p className="mt-1 text-sm text-red-300/80">
            needs action this week
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Fault Attribution</h2>
          <p className="text-sm text-slate-400">
            Who is causing your deduction losses
          </p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={faultBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {faultBreakdown.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={tooltipStyle}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Weekly Recovery Trend</h2>
          <p className="text-sm text-slate-400">
            Disputed vs recovered dollars per week
          </p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRecovery}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis dataKey="week" stroke="#64748b" />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value: any) =>
                    "$" + Math.round(Number(value) / 1000) + "k"
                  }
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Bar
                  dataKey="disputed"
                  name="Disputed"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="recovered"
                  name="Recovered"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">
            Deductions at Stake by Retailer
          </h2>
          <p className="text-sm text-slate-400">
            Current open exposure per retailer
          </p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retailerAtStake}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value: any) =>
                    "$" + Math.round(Number(value) / 1000) + "k"
                  }
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="value"
                  name="At Stake"
                  fill="#f87171"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">3PL Performance Scorecard</h2>
          <p className="text-sm text-slate-400">
            Fault rate and evidence speed by logistics partner
          </p>

          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2 pr-4 font-medium">3PL</th>
                <th className="py-2 pr-4 font-medium">Shipments</th>
                <th className="py-2 pr-4 font-medium">Faults</th>
                <th className="py-2 pr-4 font-medium">Fault %</th>
                <th className="py-2 font-medium">Avg POD Days</th>
              </tr>
            </thead>

            <tbody>
              {threePlScorecard.map(row => (
                <tr key={row.name} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4 font-medium">{row.name}</td>
                  <td className="py-3 pr-4">
                    {row.shipments.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4">{row.faults}</td>
                  <td
                    className={
                      row.faultPct > 5
                        ? "py-3 pr-4 font-bold text-red-400"
                        : "py-3 pr-4 font-bold text-emerald-400"
                    }
                  >
                    {row.faultPct}%
                  </td>
                  <td className="py-3">{row.avgPodDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            Insight: Hub Group causes 3.9x more faults than ShipBob and is
            4x slower to provide PODs. Recommended action: review SLA terms
            and enable automatic 3PL back-charges.
          </div>
        </div>
      </div>
    </div>
  );
}
