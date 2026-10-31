'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui/StatCard';

export default function HearingsPage() {
  const [hearings, setHearings] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [conflictError, setConflictError] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    caseId: '',
    hearingDate: '',
    courtRoom: 'Court Hall 3',
    judgeName: 'Hon. Justice M. Rao',
    hearingType: 'PRELIMINARY',
    summaryNotes: '',
  });

  const fetchHearings = async () => {
    setLoading(true);
    try {
      const [hearingsRes, casesRes, authRes] = await Promise.all([
        fetch(`/api/hearings?outcome=${outcomeFilter}`),
        fetch('/api/cases'),
        fetch('/api/auth/me'),
      ]);

      const hData = await hearingsRes.json();
      const cData = await casesRes.json();
      const aData = await authRes.json();

      setHearings(hData.hearings || []);
      setCases(cData.cases || []);
      if (aData.authenticated) setUser(aData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, [outcomeFilter]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduling(true);
    setConflictError(null);

    try {
      const res = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflictError(json);
          return;
        }
        throw new Error(json.error || 'Scheduling failed');
      }

      setModalOpen(false);
      setForm({
        caseId: '',
        hearingDate: '',
        courtRoom: 'Court Hall 3',
        judgeName: 'Hon. Justice M. Rao',
        hearingType: 'PRELIMINARY',
        summaryNotes: '',
      });
      fetchHearings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Court Hearing Docket & Schedules"
          subtitle="Judicial calendar management with conflict detection across matrimonial benches"
          user={user}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchHearings}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              {['ADMIN', 'LAWYER'].includes(user?.role) && (
                <button
                  onClick={() => {
                    setConflictError(null);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Appearance</span>
                </button>
              )}
            </div>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Hearing Status:</span>
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="ALL">All Hearings</option>
                <option value="SCHEDULED">Upcoming / Scheduled</option>
                <option value="ADJOURNED">Adjourned</option>
                <option value="ORDER_PASSED">Order Passed</option>
                <option value="CONCLUDED">Concluded</option>
              </select>
            </div>
          </div>

          {/* Hearings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading hearing registry...</div>
            ) : hearings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Hearings Scheduled</h4>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Case Reference</th>
                      <th className="py-3 px-4">Hearing Date & Time</th>
                      <th className="py-3 px-4">Hearing Type</th>
                      <th className="py-3 px-4">Court Room & Judge</th>
                      <th className="py-3 px-4">Counsel</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hearings.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-600 block">{h.reference_number}</span>
                          <span className="text-slate-700 truncate max-w-xs block">{h.case_title}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {new Date(h.hearing_date).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {h.hearing_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{h.court_room}</p>
                          <p className="text-[11px] text-slate-500">{h.judge_name}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {h.lawyer_name || <span className="italic text-slate-400">Not Assigned</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${
                            h.outcome === 'SCHEDULED'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : h.outcome === 'CONCLUDED' || h.outcome === 'ORDER_PASSED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {h.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/cases/${h.case_id}`}
                            className="inline-flex items-center gap-1 font-semibold text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Schedule Hearing Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Hearing Appearance (Conflict-Checked)"
      >
        <form onSubmit={handleSchedule} className="space-y-4">
          {conflictError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
              <strong className="block font-bold">Schedule Conflict Warning:</strong>
              {conflictError.error}
              <div className="mt-1 font-mono text-[11px]">
                Existing Booking: {conflictError.conflictingHearing?.caseReference} &bull; Time: {new Date(conflictError.conflictingHearing?.time).toLocaleString()}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Divorce Case *
            </label>
            <select
              value={form.caseId}
              onChange={(e) => setForm({ ...form, caseId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="">Select Case Petition</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.reference_number} &bull; {c.case_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Appearance Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.hearingDate}
              onChange={(e) => setForm({ ...form, hearingDate: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hearing Type
              </label>
              <select
                value={form.hearingType}
                onChange={(e) => setForm({ ...form, hearingType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              >
                <option value="PRELIMINARY">Preliminary</option>
                <option value="MEDIATION_SESSION">Mediation Session</option>
                <option value="EVIDENCE_PRESENTATION">Evidence Presentation</option>
                <option value="CROSS_EXAMINATION">Cross Examination</option>
                <option value="FINAL_ARGUMENTS">Final Arguments</option>
                <option value="JUDGMENT_PRONOUNCEMENT">Judgment Pronouncement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Court Room
              </label>
              <input
                type="text"
                value={form.courtRoom}
                onChange={(e) => setForm({ ...form, courtRoom: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Presiding Judge
            </label>
            <input
              type="text"
              value={form.judgeName}
              onChange={(e) => setForm({ ...form, judgeName: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {scheduling ? 'Validating Conflicts...' : 'Schedule Hearing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
