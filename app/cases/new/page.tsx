'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Briefcase,
  User,
  Calendar,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    // Step 1: Case Metadata
    caseTitle: '',
    divorceCategory: 'Mutual Consent (Section 13B)',
    marriageDate: '',
    marriagePlace: '',
    separationDate: '',
    priority: 'MEDIUM',
    presidingCourt: 'Principal Family Court, Hall 2',
    notes: '',
    // Step 2: Petitioner Details
    petitionerName: '',
    petitionerGender: 'MALE',
    petitionerEmail: '',
    petitionerPhone: '',
    petitionerAddress: '',
    petitionerEmployment: '',
    petitionerIncome: '0',
    // Step 3: Respondent Details
    respondentName: '',
    respondentGender: 'FEMALE',
    respondentEmail: '',
    respondentPhone: '',
    respondentAddress: '',
    respondentEmployment: '',
    respondentIncome: '0',
    // Step 4: Legal Counsel
    assignedLawyerId: '',
  });

  useEffect(() => {
    // Fetch lawyers and user profile
    Promise.all([
      fetch('/api/lawyers').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ]).then(([lawyerData, authData]) => {
      setLawyers(lawyerData.lawyers || []);
      if (authData.authenticated) {
        setUser(authData.user);
        if (authData.user.role === 'CLIENT') {
          setForm((prev) => ({
            ...prev,
            petitionerName: authData.user.fullName || '',
            petitionerEmail: authData.user.email || '',
          }));
        }
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!form.caseTitle.trim() || !form.marriageDate) {
        setError('Case title and valid marriage date are required.');
        return;
      }
    } else if (step === 2) {
      if (!form.petitionerName.trim()) {
        setError('Petitioner legal name is mandatory.');
        return;
      }
    } else if (step === 3) {
      if (!form.respondentName.trim()) {
        setError('Respondent legal name is mandatory.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration transaction failed');
      }

      router.push(`/cases/${data.caseId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Transaction aborted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Divorce Case Registration Wizard"
          subtitle="Atomic multi-step transaction committing case metadata, litigants, and advocate assignment"
          user={user}
        />

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2">
              {[
                { s: 1, title: 'Grounds & Court' },
                { s: 2, title: 'Petitioner Info' },
                { s: 3, title: 'Respondent Info' },
                { s: 4, title: 'Counsel & Review' },
              ].map((item) => (
                <div
                  key={item.s}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    step === item.s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : step > item.s
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider">
                    Step {item.s}
                  </span>
                  <span className="text-xs font-semibold mt-0.5 block truncate">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            {/* STEP 1: CASE PARTICULARS & GROUNDS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Step 1: Matrimonial Case Particulars</h3>
                  <p className="text-xs text-slate-500">Provide legal category, marriage dates, and presiding court division</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Petition Case Title *
                  </label>
                  <input
                    type="text"
                    name="caseTitle"
                    value={form.caseTitle}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma vs Neha Sharma"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Divorce Legal Category *
                    </label>
                    <select
                      name="divorceCategory"
                      value={form.divorceCategory}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    >
                      <option value="Mutual Consent (Section 13B)">Mutual Consent (Section 13B, HMA)</option>
                      <option value="Mutual Consent (Section 28, SMA)">Mutual Consent (Section 28, SMA)</option>
                      <option value="Contested - Cruelty">Contested - Cruelty (Section 13(1)(ia))</option>
                      <option value="Contested - Desertion">Contested - Desertion (Section 13(1)(ib))</option>
                      <option value="Contested - Adultery">Contested - Adultery (Section 13(1)(i))</option>
                      <option value="Contested - Irretrievable Breakdown">Contested - Irretrievable Breakdown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Case Priority *
                    </label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Restraining / Fast Track)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Marriage Date *
                    </label>
                    <input
                      type="date"
                      name="marriageDate"
                      value={form.marriageDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Place of Marriage Solemnization
                    </label>
                    <input
                      type="text"
                      name="marriagePlace"
                      value={form.marriagePlace}
                      onChange={handleChange}
                      placeholder="City, State"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Cohabitation Separation Date
                    </label>
                    <input
                      type="date"
                      name="separationDate"
                      value={form.separationDate}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Presiding Family Court Division *
                  </label>
                  <input
                    type="text"
                    name="presidingCourt"
                    value={form.presidingCourt}
                    onChange={handleChange}
                    placeholder="e.g. Principal Family Court, Hall 2"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Preliminary Registry Notes & Ground Summary
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Summary of marital circumstances, attempts at counseling, or specific prayer for relief..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: PETITIONER INFORMATION */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Step 2: Petitioner Information (Initiating Litigant)</h3>
                  <p className="text-xs text-slate-500">Record full legal particulars of the party presenting the petition</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Petitioner Full Name *
                    </label>
                    <input
                      type="text"
                      name="petitionerName"
                      value={form.petitionerName}
                      onChange={handleChange}
                      placeholder="Legal Name"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="petitionerGender"
                      value={form.petitionerGender}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="petitionerEmail"
                      value={form.petitionerEmail}
                      onChange={handleChange}
                      placeholder="petitioner@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="petitionerPhone"
                      value={form.petitionerPhone}
                      onChange={handleChange}
                      placeholder="+91 99000 00000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Employment / Occupation
                    </label>
                    <input
                      type="text"
                      name="petitionerEmployment"
                      value={form.petitionerEmployment}
                      onChange={handleChange}
                      placeholder="e.g. Architect"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Monthly Income (₹ INR)
                    </label>
                    <input
                      type="number"
                      name="petitionerIncome"
                      value={form.petitionerIncome}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Current Residential Address
                  </label>
                  <textarea
                    name="petitionerAddress"
                    rows={2}
                    value={form.petitionerAddress}
                    onChange={handleChange}
                    placeholder="Full residential address for summons and registry notices..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: RESPONDENT INFORMATION */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Step 3: Respondent Information (Opposing Litigant)</h3>
                  <p className="text-xs text-slate-500">Record full legal particulars of the respondent spouse</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Respondent Full Name *
                    </label>
                    <input
                      type="text"
                      name="respondentName"
                      value={form.respondentName}
                      onChange={handleChange}
                      placeholder="Legal Name"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="respondentGender"
                      value={form.respondentGender}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="respondentEmail"
                      value={form.respondentEmail}
                      onChange={handleChange}
                      placeholder="respondent@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="respondentPhone"
                      value={form.respondentPhone}
                      onChange={handleChange}
                      placeholder="+91 98000 00000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Employment / Occupation
                    </label>
                    <input
                      type="text"
                      name="respondentEmployment"
                      value={form.respondentEmployment}
                      onChange={handleChange}
                      placeholder="e.g. Marketing Director"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Monthly Income (₹ INR)
                    </label>
                    <input
                      type="number"
                      name="respondentIncome"
                      value={form.respondentIncome}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Current Residential Address
                  </label>
                  <textarea
                    name="respondentAddress"
                    rows={2}
                    value={form.respondentAddress}
                    onChange={handleChange}
                    placeholder="Address where summons/court notice will be served..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: LEGAL COUNSEL & TRANSACTIONAL COMMIT */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Step 4: Legal Counsel Assignment & Final Review</h3>
                  <p className="text-xs text-slate-500">Assign legal representation and verify atomic transaction terms</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Assigned Legal Counsel (Lead Counsel)
                  </label>
                  <select
                    name="assignedLawyerId"
                    value={form.assignedLawyerId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  >
                    <option value="">Select Enrolled Legal Counsel (Optional at Filing)</option>
                    {lawyers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} &bull; {l.specialization} (Bar: {l.bar_registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Summary Table Preview */}
                <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Docket Preview</p>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <p>Title: <strong className="text-slate-900">{form.caseTitle}</strong></p>
                    <p>Category: <strong className="text-slate-900">{form.divorceCategory}</strong></p>
                    <p>Petitioner: <strong className="text-slate-900">{form.petitionerName}</strong></p>
                    <p>Respondent: <strong className="text-slate-900">{form.respondentName}</strong></p>
                    <p>Marriage Date: <strong className="text-slate-900">{form.marriageDate}</strong></p>
                    <p>Presiding Court: <strong className="text-slate-900">{form.presidingCourt}</strong></p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  <strong>ACID Transaction Notice:</strong> Submitting will atomically execute: (1) Reference Number generation via PostgreSQL function <code className="font-mono">fn_generate_case_reference()</code>, (2) Case Insertion, (3) Petitioner & Respondent Party records, (4) Counsel assignment, (5) Initial status history, and (6) MongoDB activity registration.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((p) => p - 1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <Link
                  href="/cases"
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Committing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Commit Case Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
