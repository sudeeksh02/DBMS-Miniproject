'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Server,
  Code2,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [hRes, aRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/auth/me'),
      ]);
      const hData = await hRes.json();
      const aData = await aRes.json();

      setHealth(hData);
      if (aData.authenticated) setUser(aData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResetDatabase = async () => {
    if (!confirm('WARNING: Are you sure you want to re-execute database schema and re-populate the academic benchmark seed dataset? All temporary changes will be restored to the initial state.')) {
      return;
    }

    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.message || 'Database successfully reset and reseeded.');
        fetchHealth();
      } else {
        alert(data.error || 'Reset failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="System Architecture & Database Health"
          subtitle="Real-time multi-database operational status, schema statistics, and benchmark reset"
          user={user}
          actions={
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
          {resetMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{resetMsg}</span>
            </div>
          )}

          {/* Database Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PostgreSQL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">PostgreSQL (3NF)</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {health?.databases?.postgresql?.status || 'ONLINE'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>Engine: <strong className="text-slate-800">{health?.databases?.postgresql?.engine}</strong></p>
                <p>Relational Tables: <strong className="text-slate-800">{health?.databases?.postgresql?.tablesCount} Tables</strong></p>
                <p className="text-[11px] text-slate-400">Architecture: {health?.databases?.postgresql?.architecture}</p>
              </div>
            </div>

            {/* MongoDB */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">MongoDB Document</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {health?.databases?.mongodb?.status || 'ONLINE'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>Engine Mode: <strong className="text-slate-800">{health?.databases?.mongodb?.mode}</strong></p>
                <p>Database: <strong className="text-slate-800 font-mono">{health?.databases?.mongodb?.database}</strong></p>
                <p className="text-[11px] text-slate-400">Architecture: {health?.databases?.mongodb?.architecture}</p>
              </div>
            </div>

            {/* pgvector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">pgvector Vector DB</h3>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {health?.databases?.pgvector?.status || 'ACTIVE'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>Vector Dimensions: <strong className="text-slate-800">{health?.databases?.pgvector?.dimensions}-D</strong></p>
                <p>Indexed Legal Docs: <strong className="text-slate-800">{health?.databases?.pgvector?.indexedResources} Documents</strong></p>
                <p className="text-[11px] text-slate-400">Distance Metric: {health?.databases?.pgvector?.similarityMetric}</p>
              </div>
            </div>
          </div>

          {/* Academic Demonstration Reset Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Academic Benchmark Seed & Reset Tool</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reset the database to the pristine benchmark state for university faculty evaluation. Executes <code className="font-mono text-slate-700">sql/reset.sql</code> followed by <code className="font-mono text-slate-700">sql/schema.sql</code> and <code className="font-mono text-slate-700">sql/seed.sql</code>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetDatabase}
                disabled={resetting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing DDL & DML Reset...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset & Re-Seed Academic Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Academic Implementation Summary Details */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Academic DBMS Level 3 Specifications Compliance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Transactions:</strong> Multi-step case filing commits atomically across 5 tables</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Database Triggers:</strong> <code className="font-mono text-blue-400">trg_case_status_audit</code> records all lifecycle transitions</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Functions / Procedures:</strong> Sequential reference generation <code className="font-mono text-blue-400">fn_generate_case_reference()</code></span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SQL Views:</strong> 4 views for Active Cases, Hearings, Lawyer Workload & Ledger</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>MongoDB Aggregation:</strong> Multistage <code className="font-mono text-emerald-400">$facet</code> pipeline for event distributions</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Vector Search:</strong> pgvector unit hypersphere cosine similarity search</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
