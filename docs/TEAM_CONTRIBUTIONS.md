# TEAM CONTRIBUTIONS & WORK BREAKDOWN
## Divorce Management System (DMS): DBMS Mini-Project

| | Member 1 | Member 2 |
|---|---|---|
| **Name** | Sudeeksh Nayak | Subramani B M |
| **SRN** | PES1UG24CS474 | PES1UG24CS473 |
| **Role** | Design & Implementation Lead | Verification, Hardening & Documentation Lead |

**Academic Year**: 2026–2027 · **Semester / Section**: 5 / ______ · **Faculty Guide**: ______________________

---

## 1. Summary of Roles
**Sudeeksh Nayak** designed and built the first version of the system: the relational schema, seed data, demonstration queries, MongoDB and vector-search layers, the REST API, and the full user interface.

**Subramani B M** verified that version against a real PostgreSQL 16 server, then fixed the defects, closed the security gaps, added the database test suite, and rewrote the project documentation to match the final code.

---

## 2. Work Breakdown

| Area | Sudeeksh Nayak (PES1UG24CS474) | Subramani B M (PES1UG24CS473) |
|---|---|---|
| **Relational design** | ER model; 12-table schema (`sql/schema.sql`) with primary/foreign keys, CHECK and UNIQUE constraints; reference model (`prisma/schema.prisma`); seed dataset (`sql/seed.sql`) | Fixed the column naming (`date_of_birth`); replaced unused ENUM types with documented CHECK-constraint domains; removed the `uuid-ossp` dependency that blocked the embedded-database bootstrap; completed the seed data (parties for every case) |
| **Database programming** | Audit trigger `trg_case_status_audit`; `fn_generate_case_reference()`; `fn_cosine_similarity()`; `updated_at` triggers; 4 reporting views; 16 demonstration queries | Trigger now records the acting user and the reason (transaction-local `set_config`); reference generator changed to MAX + 1 so numbers can't repeat; de-duplicated `v_active_cases_overview` with a `LATERAL` subquery; composite indexes with `EXPLAIN` evidence; corrected the query labels |
| **Transactions & integrity** | ACID pipelines for case registration, payments and onboarding (`lib/db/postgres.ts`); advocate conflict detection | Made status updates transactional; rewrote conflict detection as an index-friendly 45-minute range query; made database initialisation safe under concurrent requests |
| **NoSQL & search** | MongoDB manager with JSON fallback store and `$facet` pipeline (`lib/db/mongodb.ts`); 16-D legal embedding and search (`lib/db/vector.ts`) | Seeded the fallback store when MongoDB is offline; added a reconnection cooldown; regenerated the seed embeddings so stored and query vectors share one space (search ranking corrected) |
| **Backend APIs & security** | Authentication (bcrypt, JWT HTTP-only cookie), `requireAuth`; all REST route handlers | Fixed the demo-account password hash (login was failing); added `assertCaseAccess` case-level authorisation; role-scoped settlements, custody, payments and documents; correct 401/403 responses; upload type and size validation |
| **Frontend** | Layout, sidebar, header; landing, auth, dashboard, case, hearing, settlement, custody, analytics, search, user and settings pages | Fixed icon names for lucide-react v1; Tailwind PostCSS configuration; page metadata; audit "changed by" display; accurate vector-search labels |
| **Testing & documentation** | First drafts of README and project report | `sql/verification_tests.sql` (11 tests, all passing); checked all 16 queries and every embedded SQL statement; rewrote README and the 24-section report from the live schema; PDF export |

---

## 3. Sign-Off

**Sudeeksh Nayak** (PES1UG24CS474)
Focus: system design and first implementation (database, APIs, UI).
Signature: ____________________  Date: __________

**Subramani B M** (PES1UG24CS473)
Focus: verification, defect fixing, security hardening, testing, final documentation.
Signature: ____________________  Date: __________
