# TEAM CONTRIBUTIONS & WORK BREAKDOWN
## Divorce Management System (DMS): DBMS Mini-Project

| | Member 1 | Member 2 |
|---|---|---|
| **Name** | {{MEMBER_1_NAME}} | {{MEMBER_2_NAME}} |
| **SRN** | {{MEMBER_1_SRN}} | {{MEMBER_2_SRN}} |
| **Role** | Database Architect & Backend Lead | Full-Stack Engineer & Data Modeller |

**Academic Year**: 2026–2027 · **Semester / Section**: {{SEMESTER}} / {{SECTION}} · **Faculty Guide**: {{GUIDE_NAME}}

---

## 1. Summary of Roles
The work was split evenly. Member 1 owned the relational core: schema, constraints, functions, triggers, transactions and security. Member 2 owned reporting and the data-facing features: views, demonstration queries, MongoDB, vector search and the user interface. Both members reviewed each other's work and prepared for the viva together.

---

## 2. Work Breakdown

| Area | Member 1: Database Architect & Backend Lead | Member 2: Full-Stack Engineer & Data Modeller |
|---|---|---|
| **Relational design** | ER model and 3NF schema (`sql/schema.sql`); primary/foreign keys with CASCADE / RESTRICT / SET NULL rules; CHECK and composite UNIQUE constraints | 3NF normalisation argument; reference data model (`prisma/schema.prisma`); seed dataset (`sql/seed.sql`) |
| **Database programming** | Audit trigger `trg_case_status_audit` (records acting user and reason); `fn_generate_case_reference()`; `updated_at` triggers; single and composite indexes with `EXPLAIN` evidence | 4 reporting views (`v_active_cases_overview`, `v_upcoming_hearings_summary`, `v_lawyer_workload_metrics`, `v_financial_settlement_ledger`); 16 demonstration queries (`sql/demonstration_queries.sql`) |
| **Transactions & integrity** | ACID pipelines for case registration, payments, onboarding and status updates (`lib/db/postgres.ts` transaction wrapper); advocate conflict detection (45-minute window) | Database verification suite (`sql/verification_tests.sql`, 11 tests) |
| **NoSQL & search** | MongoDB connection manager with JSON fallback store (`lib/db/mongodb.ts`) | MongoDB collections and `$facet` analytics pipeline; 16-D legal embedding and cosine-similarity search (`lib/db/vector.ts`, `fn_cosine_similarity`) |
| **Backend APIs** | Authentication (bcrypt, JWT HTTP-only cookie), `requireAuth` / `assertCaseAccess` role-based access control; cases, hearings and payments routes | Settlements, custody, documents (upload validation, storage), notes, communications, lawyers, analytics and search routes |
| **Frontend** | Layout, role-aware sidebar and header; landing, login and register pages | Case registry, new-case wizard, case dossier; hearings, settlements, custody, analytics and search pages; role dashboards |
| **Documentation & testing** | Architecture, transactions and RBAC sections of the report; build and integration checks | Data dictionary, queries, views and testing sections of the report |

---

## 3. Sign-Off

**Member 1:** {{MEMBER_1_NAME}} ({{MEMBER_1_SRN}})
Focus: schema, constraints, functions and triggers, transactions, authentication and access control.
Signature: ____________________  Date: __________

**Member 2:** {{MEMBER_2_NAME}} ({{MEMBER_2_SRN}})
Focus: views, demonstration queries, MongoDB aggregation, vector search, user interface.
Signature: ____________________  Date: __________
