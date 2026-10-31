'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Plus,
  RefreshCw,
  Scale,
  Activity,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

const STATUS_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#64748B'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load database analytics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* We can render the page with Header and standard layout */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Administrative Case Control Center"
          subtitle="System-wide metrics aggregated live from PostgreSQL (3NF) & MongoDB"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/cases/new"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Case</span>
              </Link>
            </div>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* KPI Stat Cards (Module 2 Requirements) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Cases"
              value={data?.summary?.totalCases ?? '...'}
              subtitle={`${data?.summary?.ongoingCases ?? 0} actively ongoing`}
              icon={Briefcase}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Pending Review"
              value={data?.summary?.registeredCases ?? '...'}
              subtitle="Summons & initial docket"
              icon={Clock}
              iconColor="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              title="Resolved Cases"
              value={data?.summary?.resolvedCases ?? '...'}
              subtitle={`Avg ${data?.resolutionStats?.avg_resolution_days ?? 0} days to decree`}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              trend="Final Decree Issued"
            />
            <StatCard
              title="Upcoming Hearings"
              value={data?.summary?.upcomingHearings ?? '...'}
              subtitle="Next scheduled court calls"
              icon={Calendar}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
            />
          </div>

          {/* Secondary Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Enrolled Counsel</p>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{data?.summary?.totalLawyers ?? '...'} Lawyers</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Active bar registrations</p>
              </div>
              <Users className="w-8 h-8 text-blue-500/30" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Total Litigants</p>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{data?.summary?.totalClients ?? '...'} Clients</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Petitioner & respondent records</p>
              </div>
              <Users className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Settlement Recovery</p>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{data?.financialStats?.recoveryRatePct ?? 0}%</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ₹{(Number(data?.financialStats?.totalPaidSum || 0) / 100000).toFixed(1)}L recovered of ₹{(Number(data?.financialStats?.totalAgreedSum || 0) / 100000).toFixed(1)}L
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500/30" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend (SQL Date Grouping) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Monthly Case Registrations</h3>
                  <p className="text-xs text-slate-500">Relational SQL aggregate grouping by filing date</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  SQL GROUP BY
                </span>
              </div>

              <div className="h-64 w-full">
                {data?.monthlyRegistrations && data.monthlyRegistrations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRegistrations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month_label" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" name="Cases Filed" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No filing records available
                  </div>
                )}
              </div>
            </div>

            {/* Case Status Distribution Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Status Distribution</h3>
                  <p className="text-xs text-slate-500">Live docket proportions</p>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Lifecycle
                </span>
              </div>

              <div className="h-48 w-full">
                {data?.statusDistribution && data.statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {data.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No status data
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {data?.statusDistribution?.map((item: any, idx: number) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[140px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length] }} />
                      <span className="truncate">{item.status.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="font-bold text-slate-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Lawyer Workload and Capacity (From SQL View) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lawyer Workload & Capacity Utilization</h3>
                <p className="text-xs text-slate-500">Querying SQL View: <code className="text-blue-600 font-mono">v_lawyer_workload_metrics</code></p>
              </div>
              <Link href="/lawyers" className="text-xs font-semibold text-blue-600 hover:underline">
                View Full Directory &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Advocate</th>
                    <th className="py-2.5 px-3">Bar Registration</th>
                    <th className="py-2.5 px-3">Specialization</th>
                    <th className="py-2.5 px-3">Active Cases</th>
                    <th className="py-2.5 px-3">Pending Hearings</th>
                    <th className="py-2.5 px-3">Capacity Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.lawyerWorkload?.map((lawyer: any) => {
                    const util = Number(lawyer.capacity_utilization_pct || 0);
                    return (
                      <tr key={lawyer.lawyer_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{lawyer.lawyer_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{lawyer.bar_registration_number}</td>
                        <td className="py-2.5 px-3 text-slate-600">{lawyer.specialization}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-600">{lawyer.active_cases_count}</td>
                        <td className="py-2.5 px-3 text-amber-600 font-semibold">{lawyer.pending_hearings_count}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  util > 80 ? 'bg-red-500' : util > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(util, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">{util}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: MongoDB Aggregation Pipeline Showcase */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">MongoDB Aggregation Pipeline ($facet)</h3>
                  <p className="text-xs text-slate-400">Multi-stage document analytics processing case activity stream</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20">
                mongo.aggregate([ $facet: &#123; monthlyTrends, eventDistribution &#125; ])
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Branch 1: Event Type Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Polymorphic Case Event Distribution (MongoDB)
                </h4>
                <div className="space-y-1.5">
                  {data?.mongoActivityAggregation?.eventTypeDistribution?.map((item: any) => (
                    <div key={item.eventType} className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg text-xs">
                      <span className="font-mono text-slate-300">{item.eventType}</span>
                      <span className="font-bold text-emerald-400">{item.count} events</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch 2: Actor Velocity */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Top Stakeholder Action Frequency
                </h4>
                <div className="space-y-1.5">
                  {data?.mongoActivityAggregation?.topActors?.map((actor: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg text-xs">
                      <div>
                        <p className="font-semibold text-white">{actor.actorName}</p>
                        <span className="text-[10px] text-amber-400 uppercase">{actor.actorRole}</span>
                      </div>
                      <span className="font-bold text-blue-400">{actor.actionsCount} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
