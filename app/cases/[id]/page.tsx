'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Heart,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  Upload,
  ArrowLeft,
  ChevronRight,
  Shield,
  Loader2,
  FileUp,
  Download,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/StatCard';

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'parties' | 'hearings' | 'documents' | 'settlement' | 'custody' | 'notes'>('overview');
  const [user, setUser] = useState<any>(null);

  // Modal States
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [hearingModalOpen, setHearingModalOpen] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [courtRoom, setCourtRoom] = useState('Court Hall 3');
  const [judgeName, setJudgeName] = useState('Hon. Justice M. Rao');
  const [hearingType, setHearingType] = useState('PRELIMINARY');
  const [hearingNotes, setHearingNotes] = useState('');
  const [schedulingHearing, setSchedulingHearing] = useState(false);
  const [hearingConflictError, setHearingConflictError] = useState<any>(null);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Evidence');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteImportance, setNoteImportance] = useState('MEDIUM');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const fetchCaseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [caseRes, authRes] = await Promise.all([
        fetch(`/api/cases/${caseId}`),
        fetch('/api/auth/me'),
      ]);

      if (!caseRes.ok) {
        const errJson = await caseRes.json();
        throw new Error(errJson.error || 'Failed to fetch case details');
      }

      const caseJson = await caseRes.json();
      const authJson = await authRes.json();

      setData(caseJson);
      setNewStatus(caseJson.case.status);
      if (authJson.authenticated) setUser(authJson.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  // Handlers
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          statusChangeReason: statusReason,
        }),
      });
      if (res.ok) {
        setStatusModalOpen(false);
        setStatusReason('');
        fetchCaseDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleScheduleHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingHearing(true);
    setHearingConflictError(null);

    try {
      const res = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          hearingDate,
          courtRoom,
          judgeName,
          hearingType,
          summaryNotes: hearingNotes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setHearingConflictError(json);
          return;
        }
        throw new Error(json.error || 'Scheduling failed');
      }

      setHearingModalOpen(false);
      setHearingNotes('');
      fetchCaseDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSchedulingHearing(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      alert('Please select a file');
      return;
    }
    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('title', docTitle);
      formData.append('category', docCategory);
      formData.append('file', docFile);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setDocModalOpen(false);
        setDocTitle('');
        setDocFile(null);
        fetchCaseDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Document upload failed');
      }
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.settlement?.id) return;
    setRecordingPayment(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementId: data.settlement.id,
          amountPaid: payAmount,
          paymentMethod: payMethod,
          transactionReference: payRef,
        }),
      });

      if (res.ok) {
        setPaymentModalOpen(false);
        setPayAmount('');
        setPayRef('');
        fetchCaseDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Payment recording failed');
      }
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setSendingMsg(true);

    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          message: msgInput,
        }),
      });

      if (res.ok) {
        setMsgInput('');
        fetchCaseDetails();
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNote(true);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          noteTitle,
          content: noteContent,
          importance: noteImportance,
        }),
      });

      if (res.ok) {
        setNoteModalOpen(false);
        setNoteTitle('');
        setNoteContent('');
        fetchCaseDetails();
      }
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading case dossier...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 p-8 text-center">
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900">Unable to Access Dossier</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <Link
              href="/cases"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case Docket</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { case: c, parties, assignedLawyers, hearings, settlement, payments, custody, statusHistory, activities, documents, communications, notes } = data;

  const petitioner = parties?.find((p: any) => p.party_role === 'PETITIONER');
  const respondent = parties?.find((p: any) => p.party_role === 'RESPONDENT');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={c.reference_number}
          subtitle={c.case_title}
          user={user}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/cases"
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cases</span>
              </Link>
              {['ADMIN', 'LAWYER'].includes(user?.role) && (
                <button
                  onClick={() => setStatusModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  <span>Update Case Status</span>
                </button>
              )}
            </div>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Banner Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {c.reference_number}
                  </span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                    {c.divorce_category}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{c.case_title}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Filed on: <strong>{new Date(c.filing_date).toLocaleDateString()}</strong> &bull; Presiding: <strong>{c.presiding_court}</strong> &bull; Marriage: <strong>{new Date(c.marriage_date).toLocaleDateString()}</strong> ({c.marriage_place || 'Place not specified'})
                </p>
              </div>

              {/* Litigants quick summary */}
              <div className="flex items-center gap-6 text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Petitioner</span>
                  <span className="font-semibold text-slate-900">{petitioner?.full_name || 'N/A'}</span>
                </div>
                <div className="text-slate-300 font-bold">&bull;</div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Respondent</span>
                  <span className="font-semibold text-slate-900">{respondent?.full_name || 'N/A'}</span>
                </div>
                <div className="text-slate-300 font-bold">&bull;</div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lead Counsel</span>
                  <span className="font-semibold text-blue-600">{assignedLawyers?.[0]?.lawyer_name || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 mt-6 pt-4 border-t border-slate-100 text-xs font-semibold">
              {[
                { id: 'overview', label: 'Overview & Activity Timeline', icon: Clock },
                { id: 'parties', label: 'Litigant Parties & Marriage', icon: Users },
                { id: 'hearings', label: `Hearings (${hearings?.length || 0})`, icon: Calendar },
                { id: 'documents', label: `Document Vault (${documents?.length || 0})`, icon: FileText },
                { id: 'settlement', label: 'Settlement & Alimony', icon: DollarSign },
                { id: 'custody', label: 'Child Custody', icon: Heart },
                { id: 'notes', label: `Notes & Chat (${communications?.length || 0})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: OVERVIEW & MONGODB ACTIVITY TIMELINE */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chronological Activity Timeline (from MongoDB) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Case Activity Timeline (MongoDB Document Store)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Chronological history of registered milestones, filings, and hearing notices</p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    case_activities
                  </span>
                </div>

                <div className="space-y-4">
                  {activities && activities.length > 0 ? (
                    activities.map((act: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                          {idx !== activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{act.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{act.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>Actor: <strong className="text-slate-600">{act.actorName}</strong> ({act.actorRole})</span>
                            <span>&bull;</span>
                            <span className="font-mono">{act.eventType}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4">No activity events recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Status History (PostgreSQL Trigger-Maintained) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Status Audit History</span>
                    </h3>
                    <p className="text-xs text-slate-500">PostgreSQL Trigger: <code className="font-mono text-purple-700">trg_case_status_audit</code></p>
                  </div>
                </div>

                <div className="space-y-3">
                  {statusHistory && statusHistory.length > 0 ? (
                    statusHistory.map((hist: any) => (
                      <div key={hist.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-900">{hist.new_status}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(hist.changed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">{hist.reason || 'Status transition committed.'}</p>
                        {hist.previous_status && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            From: <span className="line-through">{hist.previous_status}</span>
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No status history yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARTIES & MARRIAGE */}
          {activeTab === 'parties' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Petitioner Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Petitioner Particulars</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Initiating Litigant
                  </span>
                </div>

                {petitioner ? (
                  <div className="space-y-2.5 text-xs">
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Legal Name:</span>
                      <strong className="text-slate-900">{petitioner.full_name}</strong>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Gender:</span>
                      <span className="text-slate-700 font-medium">{petitioner.gender}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-700 font-mono">{petitioner.email || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-slate-700">{petitioner.phone_number || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Employment:</span>
                      <span className="text-slate-700">{petitioner.employment || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Monthly Income:</span>
                      <strong className="text-slate-900">₹{Number(petitioner.monthly_income || 0).toLocaleString()}</strong>
                    </p>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Residential Address:</span>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded-lg">{petitioner.current_address || 'Address unrecorded'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Petitioner record unpopulated.</p>
                )}
              </div>

              {/* Respondent Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Respondent Particulars</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Responding Spouse
                  </span>
                </div>

                {respondent ? (
                  <div className="space-y-2.5 text-xs">
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Legal Name:</span>
                      <strong className="text-slate-900">{respondent.full_name}</strong>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Gender:</span>
                      <span className="text-slate-700 font-medium">{respondent.gender}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-700 font-mono">{respondent.email || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-slate-700">{respondent.phone_number || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Employment:</span>
                      <span className="text-slate-700">{respondent.employment || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Monthly Income:</span>
                      <strong className="text-slate-900">₹{Number(respondent.monthly_income || 0).toLocaleString()}</strong>
                    </p>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Summons Service Address:</span>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded-lg">{respondent.current_address || 'Address unrecorded'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Respondent record unpopulated.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HEARINGS */}
          {activeTab === 'hearings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Court Appearance Hearings</h3>
                  <p className="text-xs text-slate-500">Listing of scheduled motions, evidence submissions, and final arguments</p>
                </div>
                {['ADMIN', 'LAWYER'].includes(user?.role) && (
                  <button
                    onClick={() => {
                      setHearingConflictError(null);
                      setHearingModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Hearing</span>
                  </button>
                )}
              </div>

              {hearings && hearings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Court Room & Presiding Judge</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-3">Judicial Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hearings.map((h: any) => (
                        <tr key={h.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {new Date(h.hearing_date).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {h.hearing_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{h.court_room}</p>
                            <p className="text-[11px] text-slate-500">{h.judge_name}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {h.outcome}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                            {h.summary_notes || 'Pending appearance'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No hearings scheduled for this case.</p>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENT VAULT */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Legal Document Vault & Evidence Records</h3>
                  <p className="text-xs text-slate-500">Indexed via MongoDB Document Store &bull; Local Storage Validation</p>
                </div>
                <button
                  onClick={() => setDocModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <div key={doc._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between text-xs">
                      <div className="space-y-1 pr-2">
                        <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px]">
                          {doc.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{doc.title}</h4>
                        <p className="text-slate-500 text-[11px] font-mono">{doc.fileName} &bull; {Math.round(doc.fileSizeBytes / 1024)} KB</p>
                        <p className="text-slate-400 text-[10px]">
                          Uploaded by: {doc.uploaderName} ({doc.uploaderRole}) on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <a
                        href={`/api/documents/${doc.fileName}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded to this case vault.</p>
              )}
            </div>
          )}

          {/* TAB 5: FINANCIAL SETTLEMENTS & PAYMENTS */}
          {activeTab === 'settlement' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Financial Settlement & Maintenance Agreement</h3>
                    <p className="text-xs text-slate-500">Agreed lump-sum disbursements, permanent alimony, and judicial compliance</p>
                  </div>
                  {settlement && ['ADMIN', 'LAWYER', 'CLIENT'].includes(user?.role) && (
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>

                {settlement ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Total Agreed Sum</span>
                        <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                          ₹{Number(settlement.total_agreed_amount).toLocaleString()}
                        </h4>
                        <span className="text-[10px] text-amber-800 font-medium">{settlement.settlement_type}</span>
                      </div>

                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Monthly Alimony</span>
                        <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                          ₹{Number(settlement.monthly_alimony).toLocaleString()}
                        </h4>
                        <span className="text-[10px] text-blue-700">Tenure: {settlement.alimony_tenure_months} Months</span>
                      </div>

                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Payment Status</span>
                        <h4 className="text-base font-bold text-emerald-800 mt-1">
                          {settlement.payment_status}
                        </h4>
                        <span className="text-[10px] text-slate-400">Automated SQL tracking</span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Settlement Date</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">
                          {settlement.settlement_date ? new Date(settlement.settlement_date).toLocaleDateString() : 'Draft Stage'}
                        </h4>
                      </div>
                    </div>

                    {settlement.terms_conditions && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Terms & Conditions
                        </span>
                        <p className="text-slate-600 leading-relaxed">{settlement.terms_conditions}</p>
                      </div>
                    )}

                    {/* Payments Table */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                        Recorded Financial Transactions
                      </h4>
                      {payments && payments.length > 0 ? (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Amount</th>
                              <th className="py-2 px-3">Method</th>
                              <th className="py-2 px-3">Transaction Reference</th>
                              <th className="py-2 px-3">Receipt Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payments.map((p: any) => (
                              <tr key={p.id}>
                                <td className="py-2.5 px-3 text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">₹{Number(p.amount_paid).toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-slate-700">{p.payment_method}</td>
                                <td className="py-2.5 px-3 font-mono text-blue-600">{p.transaction_reference}</td>
                                <td className="py-2.5 px-3 text-slate-500">{p.receipt_notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-slate-400 py-3">No payments recorded yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">Settlement agreement terms pending formulation.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CHILD CUSTODY */}
          {activeTab === 'custody' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Child Custody & Guardianship Arrangement</h3>
                  <p className="text-xs text-slate-500">Legal custody division, visitation schedule, and monthly support</p>
                </div>
              </div>

              {custody ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase">Custody Type</span>
                      <h4 className="text-base font-bold text-purple-900 mt-1">
                        {custody.custody_type.replace(/_/g, ' ')}
                      </h4>
                    </div>

                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase">Minor Children</span>
                      <h4 className="text-base font-bold text-blue-900 mt-1">
                        {custody.number_of_children} {custody.number_of_children === 1 ? 'Child' : 'Children'}
                      </h4>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase">Monthly Child Support</span>
                      <h4 className="text-base font-bold text-emerald-900 mt-1">
                        ₹{Number(custody.monthly_support_amount).toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Children Particulars
                    </span>
                    <p className="text-slate-800">{custody.children_details || 'Details not provided'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Parental Visitation Schedule
                    </span>
                    <p className="text-slate-800">{custody.visitation_schedule || 'Schedule not provided'}</p>
                  </div>

                  {custody.special_conditions && (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">
                        Special Conditions & Travel Restrictions
                      </span>
                      <p className="text-amber-900">{custody.special_conditions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No custody arrangements registered for this case.</p>
              )}
            </div>
          )}

          {/* TAB 7: NOTES & COMMUNICATIONS (MONGODB) */}
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lawyer Internal Workstation Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Advocate Case Notes</h3>
                    <p className="text-xs text-slate-500">Unstructured legal observations stored in MongoDB</p>
                  </div>
                  {['ADMIN', 'LAWYER'].includes(user?.role) && (
                    <button
                      onClick={() => setNoteModalOpen(true)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                  {notes && notes.length > 0 ? (
                    notes.map((n: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{n.noteTitle}</span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            {n.importance}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{n.content}</p>
                        <p className="text-[10px] text-slate-400 pt-1">
                          By: {n.lawyerName} &bull; {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No advocate notes on record.</p>
                  )}
                </div>
              </div>

              {/* Case-Related Messaging Stream */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
                <div className="pb-3 border-b border-slate-100 mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Case Communications</h3>
                  <p className="text-xs text-slate-500">Privileged dialogue between litigant and legal representation</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1">
                  {communications && communications.length > 0 ? (
                    communications.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs ${
                          m.senderRole === 'CLIENT'
                            ? 'bg-blue-50 text-blue-900 border border-blue-100 ml-6'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1">
                          <span>{m.senderName} ({m.senderRole})</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No messages exchanged yet.</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Type a case-related message..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !msgInput.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Update Case Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Case Lifecycle Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Lifecycle Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="REGISTERED">Registered</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTATION_PENDING">Documentation Pending</option>
              <option value="MEDIATION">Mediation</option>
              <option value="HEARING_SCHEDULED">Hearing Scheduled</option>
              <option value="SETTLEMENT_NEGOTIATION">Settlement Negotiation</option>
              <option value="AWAITING_FINAL_ORDER">Awaiting Final Order</option>
              <option value="RESOLVED">Resolved (Decree Signed)</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason / Judicial Order Citation
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Record justification for status transition (will be stored by DB trigger)..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {updatingStatus ? 'Executing Trigger...' : 'Commit Status Change'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Schedule Hearing */}
      <Modal
        isOpen={hearingModalOpen}
        onClose={() => setHearingModalOpen(false)}
        title="Schedule Court Hearing"
      >
        <form onSubmit={handleScheduleHearing} className="space-y-4">
          {hearingConflictError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
              <strong className="block font-bold">Schedule Conflict Detected:</strong>
              {hearingConflictError.error}
              <div className="mt-1 font-mono text-[11px]">
                Conflicting Case: {hearingConflictError.conflictingHearing?.caseReference} &bull; Time: {new Date(hearingConflictError.conflictingHearing?.time).toLocaleString()}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hearing Date & Time *
            </label>
            <input
              type="datetime-local"
              value={hearingDate}
              onChange={(e) => setHearingDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Hearing Type
              </label>
              <select
                value={hearingType}
                onChange={(e) => setHearingType(e.target.value)}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Court Room
              </label>
              <input
                type="text"
                value={courtRoom}
                onChange={(e) => setCourtRoom(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Presiding Judge
            </label>
            <input
              type="text"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Preliminary Appearance Notes
            </label>
            <textarea
              rows={2}
              value={hearingNotes}
              onChange={(e) => setHearingNotes(e.target.value)}
              placeholder="Instructions to litigants, mandatory documents to produce..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setHearingModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={schedulingHearing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {schedulingHearing ? 'Validating Conflicts...' : 'Schedule Hearing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Upload Document */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Upload Legal Document or Evidence"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Title *
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Notarized Income Affidavit"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Category *
            </label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="Marriage Certificate">Marriage Certificate</option>
              <option value="Identity Proof">Identity Proof</option>
              <option value="Financial Statements">Financial Statements</option>
              <option value="Petition">Petition</option>
              <option value="Evidence">Evidence</option>
              <option value="Settlement Agreement">Settlement Agreement</option>
              <option value="Court Order">Court Order</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select File *
            </label>
            <input
              type="file"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingDoc}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {uploadingDoc ? 'Uploading...' : 'Save & Index in MongoDB'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Record Payment */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Settlement Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount (₹ INR) *
            </label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="Demand Draft">Demand Draft (Court Deposit)</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI / Digital</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Transaction Reference / UTR Number *
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. TXN-HDFC-998877"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {recordingPayment ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Add Note */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Add Advocate Internal Note"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Note Title *
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. Alimony Calculation Strategy"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Importance
            </label>
            <select
              value={noteImportance}
              onChange={(e) => setNoteImportance(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Observation Content *
            </label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Privileged notes on cooling off waiver, custody stance, or asset discovery..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setNoteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {savingNote ? 'Saving...' : 'Save Note (MongoDB)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
