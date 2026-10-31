import Link from 'next/link';
import {
  Scale,
  Database,
  Shield,
  FileCheck2,
  Users2,
  Sparkles,
  ArrowRight,
  Lock,
  GitBranch,
  Layers,
  BookOpen,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'LAWYER') return '/lawyer/dashboard';
    return '/client/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Legal & Academic Simulation Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>ACADEMIC PROJECT DISCLAIMER:</strong> This is an educational university DBMS mini-project simulating a divorce case management office. It is not an official court filing portal and does NOT provide legal advice.
        </span>
      </div>

      {/* Navigation Header */}
      <nav className="border-b border-slate-800/80 bg-[#0B132B]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Scale className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
              DivorceMS
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                DBMS L3
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Divorce Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/semantic-search"
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline-block"
          >
            Legal AI Search (pgvector)
          </Link>
          <Link
            href="/settings"
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline-block"
          >
            Architecture & Health
          </Link>

          {user ? (
            <Link
              href={getDashboardHref()}
              className="flex items-center gap-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              <span>Go to {user.role} Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors shadow-md shadow-blue-600/30"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Paradigm Database System: PostgreSQL 3NF + MongoDB + pgvector</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          Centralized Legal Platform for{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            Divorce Proceedings
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          An enterprise-grade university DBMS project engineering an academically normalized relational schema, document timeline aggregation, schedule conflict prevention, and cosine vector semantic search.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href={user ? getDashboardHref() : '/login'}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <span>{user ? 'Open Dashboard' : 'Launch Demo Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/semantic-search"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-xl border border-slate-700 transition-all"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Test pgvector Semantic Search</span>
          </Link>
        </div>

        {/* Quick Demo Credentials Box */}
        <div className="mt-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-left w-full max-w-3xl shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Evaluation Quick-Access Accounts (Password: Password123!)</span>
            </div>
            <Link href="/login" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Go to Login Page &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <Link
              href="/login?role=admin"
              className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Admin</span>
                <span className="text-[10px] text-slate-400 group-hover:text-white">Auto-fill &rarr;</span>
              </div>
              <p className="text-xs font-semibold text-white mt-1">Registrar Rajeshwari</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">admin@divorcems.gov.in</p>
            </Link>

            <Link
              href="/login?role=lawyer"
              className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Lawyer</span>
                <span className="text-[10px] text-slate-400 group-hover:text-white">Auto-fill &rarr;</span>
              </div>
              <p className="text-xs font-semibold text-white mt-1">Adv. Vikram Mehta</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">vikram.mehta@legalfirm.in</p>
            </Link>

            <Link
              href="/login?role=client"
              className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Client</span>
                <span className="text-[10px] text-slate-400 group-hover:text-white">Auto-fill &rarr;</span>
              </div>
              <p className="text-xs font-semibold text-white mt-1">Arjun Kapoor (Petitioner)</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">arjun.kapoor@example.com</p>
            </Link>
          </div>
        </div>
      </header>

      {/* Academic DBMS Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          Demonstrated Advanced Database Architectures
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Relational 3NF & PostgreSQL */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/40 transition-all">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">PostgreSQL 3NF Relational</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              12 normalized entities with foreign keys, ON DELETE cascading policies, CHECK constraints, composite indexes, and Prisma ORM client integration.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                ACID Transactions for Case Registration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Database Triggers for Status Auditing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                4 SQL Views & Stored Procedures
              </li>
            </ul>
          </div>

          {/* Card 2: MongoDB Document Paradigm */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">MongoDB Document Store</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Document-oriented collections utilizing the official MongoDB Node.js driver for polymorphic event streams, client-counsel messaging, and unstructured case notes.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                $facet Multistage Aggregation Pipeline
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Dynamic Case Activity Timelines
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Document Metadata & Evidence Indexing
              </li>
            </ul>
          </div>

          {/* Card 3: pgvector Semantic Search */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">pgvector Semantic Search</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Vector database functionality executing cosine similarity retrieval across Hindu Marriage Act, Special Marriage Act, Supreme Court precedents, and custody formulas.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                16-Dimension Ontological Embeddings
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                fn_cosine_similarity Vector Math Operator
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Real-time Relevance Scoring
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B132B] py-6 px-6 text-center text-xs text-slate-500 mt-auto">
        <p>Divorce Management System (DMS) &bull; University DBMS Level 3 Mini-Project</p>
        <p className="mt-1 text-slate-400">PostgreSQL (3NF) &bull; MongoDB Official Driver &bull; pgvector Semantic Search &bull; Next.js 16 App Router</p>
      </footer>
    </div>
  );
}
