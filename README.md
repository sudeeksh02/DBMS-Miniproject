# Divorce Management System (DMS)
### University Level 3 DBMS Mini-Project

A full-stack, enterprise-grade matrimonial case management platform built with **PostgreSQL (3NF Normalized)**, **Prisma ORM**, **MongoDB (Official Driver)**, **pgvector Semantic Retrieval**, and **Next.js 16 (App Router + Turbopack + Tailwind CSS)**.

---

## 🌟 Key Features

1. **Dual-Database Polyglot Persistence**:
   - **PostgreSQL**: 3NF normalized schema across 12 relational entities, foreign keys, triggers, stored procedures, and 4 analytical views.
   - **MongoDB**: Operational document store for evidence metadata, communications, caucus notes, and a multi-stage `$facet` aggregation pipeline.
   - **pgvector**: 16-dimensional semantic search over landmark family law precedents and matrimonial statutes using cosine similarity.
2. **ACID Transactional Guarantees**:
   - Atomic case registration (petitioner & respondent linking, docket reference generation, and status auditing).
   - Atomic payment disbursements with settlement balance updates.
3. **Advanced Database Automations**:
   - **Trigger (`trg_case_status_audit`)**: Automated audit log of every case status transition into `case_status_history`.
   - **Stored Procedure (`fn_generate_case_reference`)**: Automated alphanumeric docket generator (`FC-YYYY-XXXXX`).
   - **Advocate Conflict Detection**: SQL temporal collision query preventing lawyer double-booking within 45-minute hearing intervals.
4. **16 Complex Demonstration SQL Queries**:
   - Covering INNER/LEFT JOINs, GROUP BY, HAVING, correlated subqueries, EXISTS/NOT EXISTS, window functions (`ROW_NUMBER`, `DENSE_RANK`, `SUM OVER`), and date arithmetic.
5. **Role-Based Access Control (RBAC)**:
   - Dedicated authenticated workstations for **System Administrators**, **Advocates/Lawyers**, and **Litigants/Clients**.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ or 20+
- (Optional) Local PostgreSQL 16+ on port `5432` *(Note: If not configured, DMS automatically uses its built-in persistent PGlite WASM engine in `./data/postgres`)*
- (Optional) Local MongoDB on `mongodb://127.0.0.1:27017`

### 2. Environment Setup
Review `.env` (a copy of `.env.example`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/divorce_db"
MONGODB_URI="mongodb://127.0.0.1:27017/divorce_management_system"
JWT_SECRET="super-secret-dms-jwt-token-key-2026-secure"
PORT=3000
```

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build Verification
```bash
npm run build
npm start
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@familycourt.gov.in` | `Admin123!` |
| **Advocate (Senior Counsel)** | `rajesh.sharma@advocates.in` | `Lawyer123!` |
| **Advocate (Defense Counsel)** | `priya.deshmukh@advocates.in` | `Lawyer123!` |
| **Litigant (Petitioner)** | `vikram.malhotra@client.in` | `Client123!` |
| **Litigant (Respondent)** | `ananya.malhotra@client.in` | `Client123!` |

*(The login page features 1-click auto-fill buttons for instant testing).*

---

## 📁 Project Architecture & Directory Layout

```text
├── app/
│   ├── api/                   # REST API route handlers
│   │   ├── analytics/         # SQL Aggregates & MongoDB $facet pipeline
│   │   ├── auth/              # Login, Logout, Register, Me (JWT sessions)
│   │   ├── cases/             # ACID Case creation & dossier retrieval
│   │   ├── hearings/          # Hearing docket + Advocate Conflict Detection
│   │   ├── lawyers/           # Workload metrics view & lawyer creation
│   │   ├── payments/          # Payment recording & settlement updates
│   │   ├── semantic-search/   # pgvector cosine similarity endpoint
│   │   ├── settlements/       # Maintenance schedules & financial ledgers
│   │   └── system/            # System health & reset diagnostics
│   ├── admin/dashboard/       # System Administrator overview & metrics
│   ├── lawyer/dashboard/      # Advocate active docket & assigned cases
│   ├── client/dashboard/      # Litigant case timeline & financial status
│   ├── cases/                 # Case list, New Case Wizard, Case Dossier
│   ├── hearings/              # Courtroom calendar & hearing docket
│   ├── settlements/           # Alimony & maintenance financial ledger
│   ├── semantic-search/       # Natural language precedent explorer
│   └── page.tsx               # Landing page with architecture showcase
├── components/                # Reusable UI library (Badges, Cards, Layout)
├── docs/
│   ├── ACADEMIC_DOCUMENTATION.md  # 24-section formal academic project report
│   └── TEAM_CONTRIBUTIONS.md      # 2-member work breakdown matrix
├── lib/
│   ├── db/
│   │   ├── postgres.ts        # PostgreSQL dual-mode client (PGlite / pg Pool)
│   │   ├── mongodb.ts         # Official MongoDB client & aggregation engine
│   │   └── vector.ts          # Semantic vectorizer & cosine similarity
│   ├── auth.ts                # Bcrypt password hashing & JWT cookie verification
│   └── storage.ts             # Evidence & document file manager
├── prisma/
│   └── schema.prisma          # 3NF Relational Data Model (12 models)
└── sql/
    ├── schema.sql             # Full DDL (tables, triggers, views, indexes)
    ├── seed.sql               # Rich synthetic seed data & vector embeddings
    ├── demonstration_queries.sql # 16 Advanced Demonstration SQL Queries
    └── reset.sql              # Clean teardown script
```

---

## 📊 Academic Deliverables Included
- **Formal Academic Report**: Available at `docs/ACADEMIC_DOCUMENTATION.md` containing all 24 required sections.
- **Team Work Breakdown**: Available at `docs/TEAM_CONTRIBUTIONS.md`.
- **Relational Schema & DDL**: In `sql/schema.sql` and `prisma/schema.prisma`.
- **Demonstration Queries**: In `sql/demonstration_queries.sql`.
