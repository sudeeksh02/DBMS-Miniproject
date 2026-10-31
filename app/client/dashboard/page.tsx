'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  FileText,
  DollarSign,
  Heart,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ClientDashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchClientCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      const clientCases = data.cases || [];
      setCases(clientCases);
      if (clientCases.length > 0) {
        setSelectedCase(clientCases[0]);
        loadCaseDetails(clientCases[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setCaseDetails(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClientCases();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedCase) return;

    setSendingMsg(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase.id,
          message: msgText,
        }),
      });
      if (res.ok) {
        setMsgText('');
        loadCaseDetails(selectedCase.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMsg(false);
    }
  };

  const LIFECYCLE_STEPS = [
    'REGISTERED',
    'UNDER_REVIEW',
    'DOCUMENTATION_PENDING',
    'MEDIATION',
    'HEARING_SCHEDULED',
    'SETTLEMENT_NEGOTIATION',
    'AWAITING_FINAL_ORDER',
    'RESOLVED',
  ];

  const currentStepIndex = selectedCase ? LIFECYCLE_STEPS.indexOf(selectedCase.status) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Litigant Client Portal"
          subtitle="Track divorce petition progression, review verified court records, and consult legal counsel"
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading client docket...</div>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto mb-3">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Matrimonial Petitions Registered</h3>
              <p className="text-xs text-slate-500 mt-1">
                You currently have no active or completed divorce petitions recorded under your account.
              </p>
              <Link
                href="/cases/new"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-blue-600 text-white rounded-xl shadow-xs"
              >
                <span>Initiate Petition Filing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {/* Primary Case Banner & Lifecycle Progress */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {selectedCase.reference_number}
                      </span>
                      <StatusBadge status={selectedCase.status} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedCase.case_title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filing Date: {new Date(selectedCase.filing_date).toLocaleDateString()} &bull; Presiding Court: {selectedCase.presiding_court}
                    </p>
                  </div>

                  <Link
                    href={`/cases/${selectedCase.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs"
                  >
                    <span>Complete Legal Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Progress Tracker */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Procedural Case Progression
                  </h4>
                  <div className="relative">
                    <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 relative z-10">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        return (
                          <div
                            key={step}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className="block text-[10px] font-bold uppercase truncate">
                              {step.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] mt-0.5 block opacity-80">
                              {isDone ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Hearings, Financial Settlement, and Communications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Court Hearings Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Court Hearings</span>
                    </h3>
                  </div>

                  {caseDetails?.hearings?.length > 0 ? (
                    <div className="space-y-2.5">
                      {caseDetails.hearings.map((h: any) => (
                        <div key={h.id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{h.hearing_type.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                              {h.outcome}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1">
                            Date: {new Date(h.hearing_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{h.court_room} &bull; {h.judge_name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No hearings scheduled yet.</p>
                  )}
                </div>

                {/* Financial Settlement & Alimony */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>Financial Settlement</span>
                    </h3>
                  </div>

                  {caseDetails?.settlement ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-bold uppercase text-amber-800">Total Agreed Amount</span>
                        <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                          ₹{Number(caseDetails.settlement.total_agreed_amount).toLocaleString()}
                        </h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/60 text-[11px]">
                          <span>Status: <strong>{caseDetails.settlement.payment_status}</strong></span>
                          <span>Monthly: <strong>₹{Number(caseDetails.settlement.monthly_alimony).toLocaleString()}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="font-semibold text-slate-700 text-[11px] uppercase">Recorded Transactions</h5>
                        {caseDetails.payments?.length > 0 ? (
                          caseDetails.payments.map((p: any) => (
                            <div key={p.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800">₹{Number(p.amount_paid).toLocaleString()}</span>
                                <p className="text-[10px] text-slate-400">{p.transaction_reference}</p>
                              </div>
                              <span className="text-[10px] text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-[11px]">No transactions recorded yet.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Settlement agreement terms pending drafting.</p>
                  )}
                </div>

                {/* Direct Communications with Assigned Counsel (MongoDB) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Counsel Communications</span>
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-56 pr-1">
                    {caseDetails?.communications?.length > 0 ? (
                      caseDetails.communications.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs ${
                            c.senderRole === 'CLIENT'
                              ? 'bg-blue-50 text-blue-900 border border-blue-100 ml-4'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1">
                            <span>{c.senderName} ({c.senderRole})</span>
                            <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed">{c.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No messages exchanged yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder="Message your advocate..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !msgText.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
