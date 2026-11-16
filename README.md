# Divorce Management System (DMS)
### DBMS Mini-Project — PES University

A full-stack family-court case management system built on a **PostgreSQL relational core (3NF)**, a **MongoDB document store**, and an in-database **16-dimensional vector search** over legal precedents, with a **Next.js 16** (App Router) front end.

---

## Key Features

1. **Polyglot persistence**
   - **PostgreSQL**: 12 relational tables, primary/foreign keys with `CASCADE` / `RESTRICT` / `SET NULL` rules, 25 `CHECK` constraints, 2 composite `UNIQUE` constraints, 4 views, 4 PL/pgSQL functions (2 of them trigger functions), 4 triggers, and single-column plus composite B-tree indexes.
   - **MongoDB**: activity timelines, case documents, communications, counsel notes and audit logs, plus a multi-branch `$facet` aggregation pipeline. If MongoDB is not running, the app switches automatically to a JSON document store in `./data/mongodb_fallback`.
   - **Vector search**: 16-D embeddings stored as `FLOAT8[]` and ranked by cosine similarity using the PL/pgSQL function `fn_cosine_similarity()`. This is the same metric as pgvector's `<=>` operator, but it needs no extension, so it also runs on the embedded engine.
2. **ACID transactions**: case registration (the case, both parties, counsel, and the first history row are written together or not at all), payment recording with automatic settlement-status recalculation, user and lawyer onboarding, and case status updates.
3. **Database automation**
   - **Trigger `trg_case_status_audit`**: every status change is written to `case_status_history`, including **who** made the change and **why**. The application passes both values to the trigger as transaction-local settings.
   - **Function `fn_generate_case_reference()`**: issues sequential docket numbers in the form `DIV-YYYY-NNNN`. Because it uses MAX + 1, a deleted case never causes a duplicate number.
   - **Advocate conflict detection**: rejects a hearing that falls within **45 minutes** of another scheduled hearing for the same advocate. The check is a range query served by the composite index `(assigned_lawyer_id, hearing_date)`.
4. **16 demonstration SQL queries** (`sql/demonstration_queries.sql`) cover joins, GROUP BY/HAVING, aggregates, IN/EXISTS/NOT EXISTS, correlated subqueries, CASE, date arithmetic, UNION, and the window functions `ROW_NUMBER`, `DENSE_RANK`, `SUM OVER` and `LAG`.
5. **11 automated database tests** (`sql/verification_tests.sql`) cover the constraints, trigger, atomicity, cascades, conflict detection, views and vector math.
6. **Role-based access control**: Admin, Lawyer and Client workspaces. Server-side checks return `401`/`403`. Lawyers can only change cases they are assigned to, and clients can only see their own cases.

---

## Quick Start

### 1. Prerequisites
- **Node.js 20.9+** (required by Next.js 16)
- *(Optional)* PostgreSQL 16+. If `DATABASE_URL` is not set or the server can't be reached, DMS uses its built-in **PGlite** engine (real PostgreSQL compiled to WebAssembly) in `./data/postgres`, and creates and seeds the schema automatically on first run.
- *(Optional)* MongoDB on `mongodb://127.0.0.1:27017`. If MongoDB is unavailable, the JSON fallback store is used.

### 2. Environment (optional)
```bash
cp .env.example .env.local
```
Every variable is optional. See `.env.example` for what each one does.

### 3. Install and run
```bash
npm install
npm run dev
```
Open <http://localhost:3000>.

> Use `npm install` rather than `npm ci` the first time. The Tailwind build plugin was changed to `@tailwindcss/postcss`, so the lockfile needs to update once.

### 4. Production build
```bash
npm run build
npm start
```

### Resetting the demo data
If you ran an earlier version of this project, delete the `data/` folder (or, as Admin, use the reset button on the **Settings** page). The embedded database then re-seeds with the corrected data and password hashes.

---

## Demo Login Accounts

All demo accounts use the password **`Password123!`**. The login page has one-click auto-fill buttons for the first three.

| Role | Email | Notes |
|---|---|---|
| **Administrator** | `admin@divorcems.gov.in` | Full access |
| **Advocate** | `vikram.mehta@legalfirm.in` | Assigned to DIV-2026-0001, 0002, 0005 |
| **Advocate** | `ananya.deshmukh@lawchambers.in` | Assigned to DIV-2026-0002, 0004 |
| **Advocate** | `kavita.sharma@familyadvocates.org` | Assigned to DIV-2026-0001, 0006 (former counsel on 0003) |
| **Client (Petitioner)** | `arjun.kapoor@example.com` | Party to DIV-2026-0001 |
| **Client (Respondent)** | `priya.sharma@example.com` | Party to DIV-2026-0001 |
| **Client (Petitioner)** | `rohit.verma@example.com` | Party to DIV-2026-0002 |
| **Client (Respondent)** | `sneha.iyer@example.com` | Party to DIV-2026-0002 |

---

## Running the SQL deliverables directly (psql)

```bash
createdb dms
psql -d dms -f sql/schema.sql
psql -d dms -f sql/seed.sql
psql -d dms -f sql/demonstration_queries.sql   # 16 queries
psql -d dms -f sql/verification_tests.sql      # 11 tests, prints PASS for each
psql -d dms -f sql/reset.sql                   # drops everything
```
`schema.sql` and `seed.sql` are idempotent, so running them twice is safe.

---

## Project Layout

```text
├── app/
│   ├── api/                   # REST route handlers (auth, cases, hearings, settlements,
│   │                          #   payments, custody, documents, notes, communications,
│   │                          #   lawyers, users, analytics, semantic-search, system)
│   ├── admin/ lawyer/ client/ # Role dashboards
│   ├── cases/                 # Case registry, new-case wizard, case dossier
│   ├── hearings/ settlements/ custody/ analytics/ semantic-search/ users/ settings/
│   └── page.tsx               # Landing page
├── components/                # Layout (sidebar, header) and UI widgets
├── docs/
│   ├── ACADEMIC_DOCUMENTATION.md  # Project report (24 sections)
│   └── TEAM_CONTRIBUTIONS.md      # Work breakdown
├── lib/
│   ├── auth.ts                # bcrypt, JWT cookies, requireAuth / assertCaseAccess
│   ├── storage.ts             # Local evidence file storage (./uploads)
│   └── db/
│       ├── postgres.ts        # PostgreSQL client (pg Pool or embedded PGlite)
│       ├── mongodb.ts         # MongoDB client, JSON fallback, $facet pipeline
│       └── vector.ts          # 16-D legal embedding + cosine search
├── prisma/schema.prisma       # Reference data model (schema documentation; the app runs native SQL)
└── sql/
    ├── schema.sql             # DDL: tables, constraints, indexes, views, functions, triggers
    ├── seed.sql               # Demo data
    ├── demonstration_queries.sql
    ├── verification_tests.sql
    └── reset.sql
```

> **About Prisma:** `prisma/schema.prisma` documents the same data model as schema-as-code. At runtime the application uses hand-written parameterised SQL through `lib/db/postgres.ts`, so you don't need to run `prisma generate` to use the app.
