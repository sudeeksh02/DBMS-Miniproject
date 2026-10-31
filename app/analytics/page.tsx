'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Database,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Scale,
  DollarSign,
  Activity,
  Code,
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
  Legend,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/ui/StatCard';

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#059669', '#DB2777', '#475569'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [anaRes, authRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/auth/me'),
      ]);
      const aData = await anaRes.json();
      const uData = await authRes.json();

      setData(aData);
      if (uData.authenticated) setUser(uData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Institutional Reports & Database Analytics"
          subtitle="Cross-paradigm query evaluation spanning PostgreSQL relational aggregates and MongoDB multi-stage pipelines"
          user={user}
          actions={
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Registered Petitions"
              value={data?.summary?.totalCases ?? '...'}
              subtitle="All registered cases on record"
              icon={BarChart3}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Ongoing Proceedings"
              value={data?.summary?.ongoingCases ?? '...'}
              subtitle="Mediation & hearing stages"
              icon={Activity}
              iconColor="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              title="Average Resolution Days"
              value={`${data?.resolutionStats?.avg_resolution_days ?? 0} Days`}
              subtitle="From petition filing to decree"
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              trend="Procedural Velocity"
            />
            <StatCard
              title="Settlement Recovery Rate"
              value={`${data?.financialStats?.recoveryRatePct ?? 0}%`}
              subtitle={`₹${(Number(data?.financialStats?.totalPaidSum || 0) / 100000).toFixed(1)}L recovered`}
              icon={DollarSign}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
            />
          </div>

          {/* Section: Relational Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Monthly Case Registrations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Monthly Petition Filing Cadence</h3>
                  <p className="text-xs text-slate-500">PostgreSQL Date Truncation: <code className="font-mono text-blue-600">DATE_TRUNC('month', filing_date)</code></p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  PostgreSQL
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
                      <Bar dataKey="count" name="Petitions Filed" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
                )}
              </div>
            </div>

            {/* Chart 2: Case Category Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Legal Grounds & Category Distribution</h3>
                  <p className="text-xs text-slate-500">Section 13B Mutual Consent vs Contested Grounds</p>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Category Split
                </span>
              </div>

              <div className="h-48 w-full">
                {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryDistribution}
                        dataKey="count"
                        nameKey="divorce_category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {data.categoryDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
                )}
              </div>

              <div className="space-y-1 mt-2">
                {data?.categoryDistribution?.map((item: any, idx: number) => (
                  <div key={item.divorce_category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate">{item.divorce_category}</span>
                    </span>
                    <span className="font-bold text-slate-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: MongoDB Aggregation Pipeline ($facet) Output */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Official MongoDB Aggregation Pipeline Result</h3>
                  <p className="text-xs text-slate-400">
                    Executing <code className="text-emerald-400 font-mono">db.collection('case_activities').aggregate([ &#123; $facet: ... &#125; ])</code>
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                Document Paradigm Demonstration
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branch 1: Monthly Event Trends */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  1. Monthly Activity Timeline
                </h4>
                <div className="space-y-2">
                  {data?.mongoActivityAggregation?.monthlyActivityTrends?.map((m: any) => (
                    <div key={m.month} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg">
                      <span className="font-mono text-slate-300">{m.month}</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">{m.eventCount} events</span>
                        <span className="text-[10px] text-slate-400 block">({m.uniqueCases} cases)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch 2: Event Type Distribution */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  2. Polymorphic Event Frequencies
                </h4>
                <div className="space-y-2">
                  {data?.mongoActivityAggregation?.eventTypeDistribution?.map((e: any) => (
                    <div key={e.eventType} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg">
                      <span className="font-mono text-slate-300 truncate max-w-[150px]">{e.eventType}</span>
                      <span className="font-bold text-blue-400">{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch 3: Actor Action Velocity */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  3. Stakeholder Velocity Ranking
                </h4>
                <div className="space-y-2">
                  {data?.mongoActivityAggregation?.topActors?.map((act: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg">
                      <div>
                        <p className="font-semibold text-white">{act.actorName}</p>
                        <span className="text-[10px] text-amber-400 uppercase">{act.actorRole}</span>
                      </div>
                      <span className="font-bold text-purple-400">{act.actionsCount}</span>
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
