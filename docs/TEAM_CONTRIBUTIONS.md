# TEAM CONTRIBUTIONS & WORK BREAKDOWN
## Divorce Management System (DMS) — Level 3 DBMS Mini-Project
**Academic Year**: 2026–2027  
**Team Members**: 2 Members  

---

## 1. Executive Summary of Roles
To fulfill the requirements of a Level 3 DBMS Mini-Project, the technical scope was evenly divided between two team members across both **Database Engineering & Architecture** and **Full-Stack Application Development**.

---

## 2. Detailed Work Breakdown Matrix

| Area | Member 1: Database Architect & Backend Lead | Member 2: Full-Stack Engineer & Data Modeler |
|---|---|---|
| **Relational Database Design** | - Engineered 3NF Relational Schema (`sql/schema.sql`)<br>- Formulated Primary Keys, Foreign Keys, and Cascade rules<br>- Created `prisma/schema.prisma` definitions | - Validated 3NF Normalization Proof<br>- Created synthetic, realistic seed datasets (`sql/seed.sql`)<br>- Configured Prisma client generation |
| **Advanced Database Concepts** | - Authored Status Audit Trigger (`trg_case_status_audit`)<br>- Developed Stored Procedure for Case Reference Generation (`fn_generate_case_reference`)<br>- Implemented Composite Performance B-Tree Indexes | - Designed 4 Analytical SQL Views (`v_active_cases_overview`, `v_upcoming_hearings_summary`, `v_lawyer_workload_metrics`, `v_financial_settlement_ledger`)<br>- Formulated and validated 16 Complex Demonstration SQL Queries (`sql/demonstration_queries.sql`) |
| **NoSQL & Polyglot Architecture** | - Implemented MongoDB Node.js connection manager (`lib/db/mongodb.ts`)<br>- Configured official MongoDB driver and fail-soft fallback storage | - Designed MongoDB document schemas for documents, communications, notes, and audit logs<br>- Built multi-stage `$facet` MongoDB aggregation pipeline |
| **Vector Search & AI** | - Designed 16-dimensional legal vector hypersphere ontology (`lib/constants/vector.ts`, `lib/db/vector.ts`) | - Implemented cosine similarity calculation engine and semantic search API (`app/api/semantic-search/route.ts`) |
| **Backend & APIs** | - Built Authentication Engine (`lib/auth.ts`) with bcrypt and JWT HTTP-only cookies<br>- Implemented Advocate Schedule Conflict Detection Algorithm (`app/api/hearings/route.ts`)<br>- Implemented ACID transaction pipelines for case registration and settlements | - Developed REST API route handlers for cases, lawyers, clients, custody, documents, and payments<br>- Engineered local document storage engine (`lib/storage.ts`) and file download handlers |
| **Frontend UI/UX** | - Designed responsive AppLayout, Header, and role-adaptive Sidebar navigation (`components/layout/`)<br>- Created shared UI component library (StatusBadge, PriorityBadge, StatCard, Modal)<br>- Built Landing page (`app/page.tsx`) and Authentication pages (`login`, `register`, `unauthorized`) | - Developed Case Management workstations (`app/cases`, `app/cases/new`, `app/cases/[id]`)<br>- Built Lawyer Directory, Hearing Docket, Settlement Ledger, and Custody pages<br>- Developed Analytics Dashboard and Semantic Search Explorer UI |
| **Testing & Documentation** | - Conducted Next.js Turbopack build optimization and runtime integration testing<br>- Drafted System Architecture and API route specifications | - Authored comprehensive 24-section Academic Documentation (`docs/ACADEMIC_DOCUMENTATION.md`)<br>- Formulated test cases and verification results |

---

## 3. Contribution Verification & Sign-Off

### Member 1 Sign-Off:
- **Core Focus**: Database Schema, Triggers, Functions, ACID Transactions, Authentication & Security.
- **Status**: Completed and fully verified.

### Member 2 Sign-Off:
- **Core Focus**: SQL Views, 16 Demonstration Queries, MongoDB `$facet` Aggregations, Vector Search, UI Workstations.
- **Status**: Completed and fully verified.
