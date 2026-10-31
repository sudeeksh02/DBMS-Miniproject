# DIVORCE MANAGEMENT SYSTEM (DMS)
## Academic Project Report & Comprehensive Database Architecture Specification
**Course**: Database Management Systems (DBMS) — Level 3 Mini-Project  
**Domain**: Legal Tech & Matrimonial Dispute Resolution  
**Academic Year**: 2026–2027  

---

## 1. Title Page & Project Information
- **Project Title**: Divorce Management System (DMS)
- **Project Classification**: University Level 3 DBMS Mini-Project
- **Architecture**: Polyglot Persistence (PostgreSQL 3NF Normalized Relational Database + MongoDB Document Store + pgvector Semantic Retrieval Engine)
- **Frontend / Full-Stack Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript, Tailwind CSS)
- **ORM / Query Engine**: Dual-engine (Prisma ORM Client 6 + Direct Native SQL Pool / Embedded PGlite)

---

## 2. Executive Summary / Abstract
The **Divorce Management System (DMS)** is an enterprise-grade, secure, multi-tenant legal case management platform architected specifically for family courts, legal chambers, advocates, and litigating parties. Matrimonial dispute resolution in judicial systems is plagued by fragmented court dockets, scheduling collisions among senior advocates, uncoordinated financial maintenance tracking, sensitive evidence sprawl, and opaque case status updates for distressed litigants. 

This project bridges these critical gaps by delivering a robust dual-database architecture:
1. **PostgreSQL Relational Core**: Strictly normalized to Third Normal Form (3NF), enforcing referential integrity across 12 relational entities, ACID transactional boundary guarantees for case registration and financial disbursements, database triggers for immutable status audit trails, user-defined functions (UDFs) for automated alphanumeric case docket reference numbers, performance-tuned composite indexes, and 4 specialized analytical SQL Views.
2. **MongoDB Operational Store**: High-throughput document store engineered for heterogeneous case activity logs, client-advocate communications, unstructured evidence attachments, lawyer trial notes, and deep aggregation pipelines via `$facet`.
3. **pgvector Semantic Search**: A 16-dimensional ontological legal vector engine computing cosine similarity over landmark matrimonial precedents, statutory provisions (Hindu Marriage Act, Special Marriage Act, CrPC 125), and court guidelines.

The result is a production-hardened full-stack platform featuring granular Role-Based Access Control (RBAC) for Administrators, Lawyers, and Clients, an automated Advocate Schedule Conflict Detection algorithm, an immutable financial settlement and maintenance installment ledger, and an intuitive dark-mode interface.

---

## 3. Problem Statement & Motivation
Family court proceedings are characterized by intense emotional stress, stringent statutory timelines (such as mandatory cooling-off periods under Section 13B(2) of the Hindu Marriage Act), multi-party representation (petitioners, respondents, advocates, mediators, guardians ad litem), and recurring financial obligations (interim maintenance, permanent alimony, child support).

Conventional generic case management tools suffer from:
1. **Lack of Relational Integrity**: Failure to tie maintenance payments directly to court-ordered settlements, resulting in payment tracking discrepancies.
2. **Double-Booking & Schedule Collisions**: Advocates frequently get double-booked across different family courtrooms at the exact same hearing timestamp.
3. **Audit Trail Vulnerabilities**: Modification of sensitive case statuses or financial ledger entries without automatic, database-enforced trigger auditing.
4. **Information Asymmetry**: Litigants are kept unaware of procedural milestones, court orders, and hearing outcomes.
5. **Inefficient Precedent Discovery**: Keyword search fails to capture conceptual nuances of legal issues like "cooling-off period exemption" or "determining interim maintenance based on affidavit of assets".

The DMS directly solves these problems at the database schema, query, and application tiers.

---

## 4. Project Objectives & Scope
### Primary Objectives:
- Implement a 3NF normalized PostgreSQL relational schema modeling the complete lifecycle of divorce proceedings.
- Implement an automated ACID transaction pipeline ensuring that case creation, petitioner-respondent client linking, initial fee allocation, and document indexing occur atomically.
- Implement automated database triggers (`trg_case_status_audit`) to capture every status transition into an immutable audit table.
- Formulate and execute 16 complex demonstration SQL queries covering all university Level 3 DBMS syllabus requirements (multi-table joins, subqueries, correlated subqueries, set operations, aggregates, window functions, and views).
- Implement an Advocate Schedule Conflict Detection algorithm that prevents dual-booking of lawyers within 45-minute hearing windows.
- Integrate MongoDB for high-volume unstructured document metadata, lawyer notes, and `$facet` analytics.
- Integrate pgvector semantic retrieval for natural language querying of legal statutes and landmark judgments.

### Scope:
- **Case Lifecycle Management**: Registration, review, mediation, hearing scheduling, trial proceedings, settlement negotiation, and decree recording.
- **Role-Based Workstations**: Dedicated dashboards with server-verified RBAC for System Admins, Advocates, and Litigants.
- **Financial Ledger**: Alimony and maintenance schedules, child support installment tracking, transaction receipts, and automated balance calculation.
- **Child Custody Management**: Custody types, visitation schedules, and child welfare oversight.

---

## 5. Technology Stack & Justification

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Frontend Framework** | Next.js App Router | 16.4.3 | High-performance React 19 architecture with Server Actions, Turbopack, and hybrid static/dynamic page generation. |
| **Language & Typings** | TypeScript | 5.8 | End-to-end compile-time type safety preventing runtime bugs across database models and API payloads. |
| **Styling & Theme** | Tailwind CSS | 4.1 | Clean slate-950 dark theme optimized for legal professionals, responsive across desktop, tablet, and mobile. |
| **Primary Relational DB** | PostgreSQL / PGlite | 16+ / 0.2.14 | Robust ACID transactions, foreign keys with ON DELETE CASCADE / RESTRICT, triggers, stored procedures, and Views. |
| **Document DB** | MongoDB Official Driver | 6.14.2 | High write throughput for unstructured evidence logs, lawyer notes, and multi-stage `$facet` analytical pipelines. |
| **ORM / Schema** | Prisma ORM | 6.19.3 | Type-safe query generation, migration management, and schema-as-code documentation. |
| **Vector Engine** | pgvector / Math Engine | 16-D Unit Vector | Cosine similarity semantic search over landmark matrimonial jurisprudence. |
| **Authentication** | JWT (`jose`) + `bcryptjs` | Native HTTP-Only | Secure password hashing (10 salt rounds) and tamper-proof HTTP-only cookie sessions. |
| **Validation** | Zod | 3.24 | Runtime schema validation for all API inputs before hitting the database tier. |

---

## 6. System Architecture Diagram

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer (React 19 / Next.js 16)"]
        UI_Admin["Admin Enterprise Dashboard"]
        UI_Lawyer["Advocate Workstation & Docket"]
        UI_Client["Litigant Case Portal"]
        UI_Search["Semantic Precedent Explorer"]
    end

    subgraph Server_Layer ["Server Tier (Next.js App Router API Handlers)"]
        Auth_Guard["RBAC & JWT Session Guard (lib/auth.ts)"]
        Conflict_Engine["Advocate Conflict Detection Engine"]
        Storage_Engine["Document Storage Engine (lib/storage.ts)"]
        Vector_Engine["Semantic Vectorizer (lib/db/vector.ts)"]
    end

    subgraph Data_Tier ["Polyglot Persistence Data Tier"]
        subgraph Postgres_Core ["PostgreSQL Relational Engine (3NF)"]
            T_Cases["divorce_cases"]
            T_Lawyers["lawyers"]
            T_Clients["clients"]
            T_Hearings["hearings"]
            T_Settlements["settlements"]
            T_Payments["payments"]
            T_Custody["custody_arrangements"]
            T_Audit["case_status_history (Trigger-Populated)"]
            V_Views["4 Analytical SQL Views"]
            T_Vectors["legal_knowledge_vectors (pgvector)"]
        end

        subgraph Mongo_Store ["MongoDB Operational Store"]
            C_Docs["case_documents"]
            C_Notes["case_notes"]
            C_Comm["case_communications"]
            C_Audit["audit_logs"]
            M_Agg["$facet Multi-Stage Pipeline"]
        end
    end

    UI_Admin --> Auth_Guard
    UI_Lawyer --> Auth_Guard
    UI_Client --> Auth_Guard
    UI_Search --> Auth_Guard

    Auth_Guard --> Conflict_Engine
    Auth_Guard --> Storage_Engine
    Auth_Guard --> Vector_Engine

    Conflict_Engine --> Postgres_Core
    Storage_Engine --> Mongo_Store
    Vector_Engine --> T_Vectors
    Server_Layer --> Postgres_Core
    Server_Layer --> Mongo_Store
```

---

## 7. Entity-Relationship (ER) Conceptual Model

```mermaid
erDiagram
    USERS ||--o| LAWYERS : "extends (LAWYER role)"
    USERS ||--o| CLIENTS : "extends (CLIENT role)"
    
    LAWYERS ||--o{ DIVORCE_CASES : "represents as lead advocate"
    LAWYERS ||--o{ DIVORCE_CASES : "represents as respondent advocate"
    
    CLIENTS ||--o{ DIVORCE_CASES : "acts as petitioner"
    CLIENTS ||--o{ DIVORCE_CASES : "acts as respondent"

    DIVORCE_CASES ||--o{ HEARINGS : "schedules court proceedings"
    LAWYERS ||--o{ HEARINGS : "advocate appears"

    DIVORCE_CASES ||--o| SETTLEMENTS : "formalizes decree/agreement"
    SETTLEMENTS ||--o{ PAYMENTS : "tracks installments"

    DIVORCE_CASES ||--o| CUSTODY_ARRANGEMENTS : "defines child welfare"

    DIVORCE_CASES ||--o{ CASE_STATUS_HISTORY : "audits transitions (Trigger)"
    USERS ||--o{ CASE_STATUS_HISTORY : "changed by"
```

---

## 8. Relational Schema in 3NF & Normalization Proof
Every relation in the DMS schema satisfies the requirements of **Third Normal Form (3NF)**:
1. **1NF (First Normal Form)**:
   - All attribute values are atomic (e.g., petitioner full name is a single atomic string, dates are discrete `TIMESTAMP` values, currency fields are decimal values).
   - No repeating groups or multivalued arrays are stored as comma-separated values in core relational tables.
2. **2NF (Second Normal Form)**:
   - Meets 1NF.
   - All non-key attributes are fully functionally dependent on the entire primary key. In all entities, the primary key is a surrogate UUID or serial ID (`id`), eliminating partial functional dependencies entirely.
3. **3NF (Third Normal Form)**:
   - Meets 2NF.
   - No transitive dependencies exist between non-key attributes. For example, lawyer fee schedules and contact info depend strictly on `lawyer_id`, not on the `case_id`. Client addresses and identities depend strictly on `client_id`. Calculated financial balances (`paid_amount`, `remaining_balance`) are maintained either via ACID transaction updates or computed dynamically via SQL Views (`v_financial_settlement_ledger`).

---

## 9. Data Dictionary

### Table 1: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID v4) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account email for authentication |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted bcrypt hash |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('ADMIN', 'LAWYER', 'CLIENT') | Access authorization tier |
| `full_name` | VARCHAR(150) | NOT NULL | Real name of individual |
| `phone_number` | VARCHAR(30) | NULL | Contact phone number |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account state |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

### Table 2: `lawyers`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID v4) |
| `user_id` | VARCHAR(36) | UNIQUE, FK -> `users(id)` ON DELETE CASCADE | Associated user account |
| `bar_registration_number` | VARCHAR(100) | UNIQUE, NOT NULL | Official Bar Council license number |
| `specialization` | VARCHAR(100) | DEFAULT 'Family Law' | Legal focus domain |
| `years_experience` | INTEGER | DEFAULT 1, CHECK (>= 0) | Years in active practice |
| `office_address` | TEXT | NULL | Chambers address |
| `hourly_rate` | DECIMAL(10,2) | DEFAULT 0.00 | Professional billing rate |
| `max_case_capacity` | INTEGER | DEFAULT 15, CHECK (> 0) | Workload upper ceiling |

### Table 3: `clients`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID v4) |
| `user_id` | VARCHAR(36) | UNIQUE, FK -> `users(id)` ON DELETE CASCADE | Associated user account |
| `date_of_birth` | DATE | NULL | Client date of birth |
| `gender` | VARCHAR(20) | NULL | Gender identity |
| `residential_address` | TEXT | NULL | Current legal domicile |
| `employment_status` | VARCHAR(50) | NULL | Occupational status |
| `annual_income` | DECIMAL(12,2) | DEFAULT 0.00 | Financial disclosure base |
| `identification_number` | VARCHAR(50) | NULL | National identification / Aadhaar |

### Table 4: `divorce_cases`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Case UUID |
| `case_reference_number` | VARCHAR(50) | UNIQUE, NOT NULL | Alphanumeric docket ref (e.g. `FC-2026-00101`) |
| `petitioner_id` | VARCHAR(36) | FK -> `clients(id)` ON DELETE RESTRICT | Filing party |
| `respondent_id` | VARCHAR(36) | FK -> `clients(id)` ON DELETE RESTRICT | Answering party |
| `lead_lawyer_id` | VARCHAR(36) | FK -> `lawyers(id)` ON DELETE SET NULL | Petitioner's attorney |
| `respondent_lawyer_id` | VARCHAR(36) | FK -> `lawyers(id)` ON DELETE SET NULL | Respondent's attorney |
| `court_jurisdiction` | VARCHAR(150) | NOT NULL | Presiding family court jurisdiction |
| `case_type` | VARCHAR(50) | NOT NULL, CHECK IN ('MUTUAL_CONSENT', 'CONTESTED') | Case category |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'REGISTERED' | Case progression status |
| `priority` | VARCHAR(20) | DEFAULT 'MEDIUM' | Triage priority (LOW, MEDIUM, HIGH, URGENT) |
| `marriage_date` | DATE | NOT NULL | Date of solemnization |
| `separation_date` | DATE | NOT NULL | Date of physical separation |
| `grounds_for_divorce` | TEXT | NOT NULL | Statutory legal basis |
| `number_of_children` | INTEGER | DEFAULT 0, CHECK (>= 0) | Minor children count |
| `cooling_off_waived` | BOOLEAN | DEFAULT FALSE | Section 13B(2) statutory waiver flag |
| `filing_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registry timestamp |
| `resolution_date` | TIMESTAMP | NULL | Decree or dismissal timestamp |

### Table 5: `hearings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Hearing UUID |
| `case_id` | VARCHAR(36) | FK -> `divorce_cases(id)` ON DELETE CASCADE | Associated case |
| `lawyer_id` | VARCHAR(36) | FK -> `lawyers(id)` ON DELETE RESTRICT | Attending counsel |
| `hearing_date` | TIMESTAMP | NOT NULL | Date and time of court appearance |
| `courtroom_number` | VARCHAR(50) | NOT NULL | Courtroom or chamber hall |
| `judge_name` | VARCHAR(150) | NOT NULL | Presiding Judicial Magistrate / Judge |
| `purpose` | VARCHAR(255) | NOT NULL | Hearing purpose (First Motion, Arguments, Decree) |
| `outcome` | VARCHAR(50) | DEFAULT 'SCHEDULED' | Outcome status |
| `next_hearing_date` | TIMESTAMP | NULL | Next scheduled appearance |
| `hearing_notes` | TEXT | NULL | Verbatim bench notes |

### Table 6: `settlements`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Settlement UUID |
| `case_id` | VARCHAR(36) | UNIQUE, FK -> `divorce_cases(id)` ON DELETE CASCADE | 1-to-1 link to case |
| `alimony_amount` | DECIMAL(12,2) | DEFAULT 0.00, CHECK (>= 0) | Permanent or lump-sum alimony |
| `child_support_monthly` | DECIMAL(12,2) | DEFAULT 0.00, CHECK (>= 0) | Recurring child support |
| `property_division_summary`| TEXT | NULL | Asset partition terms |
| `payment_frequency` | VARCHAR(30) | DEFAULT 'ONE_TIME' | Schedule (ONE_TIME, MONTHLY, QUARTERLY) |
| `status` | VARCHAR(50) | DEFAULT 'DRAFT' | Settlement status |
| `agreement_date` | DATE | NULL | Date signed by parties |

### Table 7: `payments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Payment UUID |
| `settlement_id` | VARCHAR(36) | FK -> `settlements(id)` ON DELETE CASCADE | Settlement reference |
| `payer_id` | VARCHAR(36) | FK -> `clients(id)` ON DELETE RESTRICT | Paying party |
| `payee_id` | VARCHAR(36) | FK -> `clients(id)` ON DELETE RESTRICT | Receiving party |
| `amount` | DECIMAL(12,2) | NOT NULL, CHECK (> 0) | Transaction value |
| `payment_type` | VARCHAR(50) | NOT NULL | ALIMONY, CHILD_SUPPORT, LEGAL_FEES |
| `payment_method` | VARCHAR(50) | NOT NULL | BANK_TRANSFER, CHEQUE, DEMAND_DRAFT, CASH |
| `transaction_reference` | VARCHAR(100)| UNIQUE, NOT NULL | Bank transaction receipt ID |
| `payment_status` | VARCHAR(30) | DEFAULT 'PENDING' | Status (PENDING, COMPLETED, FAILED) |
| `payment_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Execution timestamp |

### Table 8: `custody_arrangements`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Custody UUID |
| `case_id` | VARCHAR(36) | UNIQUE, FK -> `divorce_cases(id)` ON DELETE CASCADE | 1-to-1 link to case |
| `custody_type` | VARCHAR(50) | NOT NULL | SOLE_MATERNAL, SOLE_PATERNAL, JOINT, SPLIT |
| `visitation_schedule` | TEXT | NOT NULL | Detailed weekly/holiday visitation terms |
| `primary_custodian_id` | VARCHAR(36) | FK -> `clients(id)` ON DELETE RESTRICT | Primary guardian |
| `child_details` | TEXT | NULL | Names and ages of minor children |
| `child_welfare_notes` | TEXT | NULL | Guardian ad litem remarks |

### Table 9: `case_status_history` (Trigger-Populated Audit Table)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Sequence counter |
| `case_id` | VARCHAR(36) | FK -> `divorce_cases(id)` ON DELETE CASCADE | Audited case |
| `old_status` | VARCHAR(50) | NULL | Prior status |
| `new_status` | VARCHAR(50) | NOT NULL | Transitioned status |
| `remarks` | TEXT | NULL | Operational reason for transition |
| `changed_by_user_id` | VARCHAR(36) | FK -> `users(id)` ON DELETE SET NULL | Authorizing user |
| `changed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Exact audit timestamp |

---

## 10. MongoDB Operational Document Schema

The DMS utilizes MongoDB to maintain high-velocity, flexible-schema records that would otherwise introduce excessive NULL values and table alterations in a relational store.

### Collection 1: `case_documents`
Stores metadata and filesystem pointers for evidence, marriage certificates, and financial affidavits:
```json
{
  "_id": "672401a8f9a4b123456789ab",
  "caseId": "c0000000-0000-0000-0000-000000000001",
  "title": "Marriage Certificate Solemnization Extract",
  "documentType": "MARRIAGE_CERTIFICATE",
  "originalFileName": "marriage_cert_delhi.pdf",
  "storagePath": "uploads/marriage_cert_delhi_1730372000000.pdf",
  "sizeBytes": 245192,
  "mimeType": "application/pdf",
  "uploadedByUserId": "10000000-0000-0000-0000-000000000002",
  "uploadedByRole": "LAWYER",
  "isConfidential": true,
  "tags": ["HM-1955", "Certificate", "Jurisdiction-Proof"],
  "createdAt": "2026-10-31T06:00:00.000Z"
}
```

### Collection 2: `case_notes`
Privileged notes taken by attorneys and judicial mediators during caucus:
```json
{
  "_id": "672401a8f9a4b123456789ac",
  "caseId": "c0000000-0000-0000-0000-000000000001",
  "authorUserId": "10000000-0000-0000-0000-000000000002",
  "authorName": "Adv. Rajesh Sharma",
  "authorRole": "LAWYER",
  "title": "Caucus Session with Petitioner",
  "content": "Petitioner agrees to waive cooling-off period under Section 13B(2) provided Streedhan items are returned intact.",
  "isPrivate": true,
  "createdAt": "2026-10-31T06:15:00.000Z"
}
```

### Collection 3: `case_communications`
Secure messaging logs exchanged between lawyers, clients, and registry staff:
```json
{
  "_id": "672401a8f9a4b123456789ad",
  "caseId": "c0000000-0000-0000-0000-000000000001",
  "senderUserId": "10000000-0000-0000-0000-000000000004",
  "senderName": "Vikram Malhotra",
  "recipientUserId": "10000000-0000-0000-0000-000000000002",
  "message": "I have uploaded the audited Income Tax Returns for the last three assessment years as requested.",
  "status": "DELIVERED",
  "createdAt": "2026-10-31T06:30:00.000Z"
}
```

---

## 11. pgvector Semantic Search & Legal Precedents Engine
The system features an integrated semantic retrieval engine indexing statutory provisions, High Court citations, and Supreme Court judgments across matrimonial disputes.

### 16-Dimensional Ontological Hypersphere:
The vector model maps legal inquiries across 16 canonical legal axes:
0. `mutual_consent` (HMA 13B, joint petition)
1. `contested_grounds` (irretrievable breakdown, cruelty)
2. `alimony_maintenance` (permanent alimony, CrPC 125, *Rajnesh v. Neha*)
3. `child_custody` (welfare of the minor, guardian)
4. `asset_division` (partition, streedhan, immovable property)
5. `cooling_off_waiver` (*Amardeep Singh v. Harveen Kaur* statutory waiver)
6. `hindu_marriage_act` (Section 13, 13B, 24, 25)
7. `special_marriage_act` (Section 28 civil divorce)
8. `mediation_counseling` (reconciliation, family court counselor)
9. `evidence_procedure` (affidavit in evidence, cross-examination)
10. `court_jurisdiction` (place of marriage, ordinary residence)
11. `cruelty_desertion` (mental cruelty, 2-year abandonment)
12. `visitation_rights` (interim contact, weekend access)
13. `financial_affidavit` (comprehensive disclosure of assets)
14. `settlement_agreement` (terms of compromise)
15. `supreme_court_ruling` (binding precedent under Article 141)

### Mathematical Formulation:
For query vector $\vec{Q}$ and resource vector $\vec{R}$, cosine similarity is evaluated as:
$$\text{Cosine Similarity} = \frac{\vec{Q} \cdot \vec{R}}{\|\vec{Q}\|_2 \times \|\vec{R}\|_2} = \frac{\sum_{i=1}^{16} Q_i R_i}{\sqrt{\sum_{i=1}^{16} Q_i^2} \sqrt{\sum_{i=1}^{16} R_i^2}}$$

When `pgvector` extension is active, search is executed via the inverted file flat index (`ivfflat`) or native `<=>` cosine distance operator:
```sql
SELECT id, title, category, citation, 1 - (embedding <=> $1::vector) AS similarity
FROM legal_knowledge_vectors
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

---

## 12. Stored Procedures, Functions & Triggers Specification

### 1. Case Reference Number Generation Function (`fn_generate_case_reference`)
Automates creation of standard judicial docket numbers in the format `FC-YYYY-XXXXX`:
```sql
CREATE OR REPLACE FUNCTION fn_generate_case_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_yr TEXT;
  case_seq INT;
  new_ref TEXT;
BEGIN
  IF NEW.case_reference_number IS NULL OR NEW.case_reference_number = '' THEN
    current_yr := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO case_seq FROM divorce_cases;
    new_ref := 'FC-' || current_yr || '-' || LPAD(case_seq::TEXT, 5, '0');
    NEW.case_reference_number := new_ref;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Status Transition Audit Trigger (`trg_case_status_audit`)
Guarantees non-repudiation and temporal accountability whenever a case changes stage:
```sql
CREATE OR REPLACE FUNCTION fn_audit_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO case_status_history (case_id, old_status, new_status, remarks, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, 'Automated status update trigger execution', CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_status_audit
AFTER UPDATE OF status ON divorce_cases
FOR EACH ROW
EXECUTE FUNCTION fn_audit_case_status_change();
```

---

## 13. Database Views Specification

### View 1: `v_active_cases_overview`
Unifies primary case facts, filing longevity, petitioner, respondent, and assigned advocates into a single queryable entity:
```sql
CREATE OR REPLACE VIEW v_active_cases_overview AS
SELECT 
  c.id AS case_id,
  c.case_reference_number,
  c.court_jurisdiction,
  c.case_type,
  c.status,
  c.priority,
  c.filing_date,
  CURRENT_DATE - c.filing_date::DATE AS days_pending,
  u_pet.full_name AS petitioner_name,
  u_res.full_name AS respondent_name,
  u_law.full_name AS lead_lawyer_name
FROM divorce_cases c
JOIN clients cl_pet ON c.petitioner_id = cl_pet.id
JOIN users u_pet ON cl_pet.user_id = u_pet.id
JOIN clients cl_res ON c.respondent_id = cl_res.id
JOIN users u_res ON cl_res.user_id = u_res.id
LEFT JOIN lawyers l ON c.lead_lawyer_id = l.id
LEFT JOIN users u_law ON l.user_id = u_law.id;
```

### View 2: `v_upcoming_hearings_summary`
Aggregates court docket schedules for judicial calendar management:
```sql
CREATE OR REPLACE VIEW v_upcoming_hearings_summary AS
SELECT 
  h.id AS hearing_id,
  h.case_id,
  c.case_reference_number,
  h.hearing_date,
  h.courtroom_number,
  h.judge_name,
  h.purpose,
  h.outcome,
  u_law.full_name AS appearing_lawyer,
  c.status AS case_status
FROM hearings h
JOIN divorce_cases c ON h.case_id = c.id
LEFT JOIN lawyers l ON h.lawyer_id = l.id
LEFT JOIN users u_law ON l.user_id = u_law.id
WHERE h.hearing_date >= CURRENT_TIMESTAMP
ORDER BY h.hearing_date ASC;
```

### View 3: `v_lawyer_workload_metrics`
Evaluates advocate case capacities and active docket distribution:
```sql
CREATE OR REPLACE VIEW v_lawyer_workload_metrics AS
SELECT 
  l.id AS lawyer_id,
  u.full_name AS lawyer_name,
  u.email,
  l.bar_registration_number,
  l.specialization,
  l.max_case_capacity,
  COUNT(c.id) AS active_cases_count,
  ROUND((COUNT(c.id)::DECIMAL / NULLIF(l.max_case_capacity, 0)) * 100, 2) AS capacity_utilization_pct
FROM lawyers l
JOIN users u ON l.user_id = u.id
LEFT JOIN divorce_cases c ON (c.lead_lawyer_id = l.id OR c.respondent_lawyer_id = l.id) 
  AND c.status NOT IN ('RESOLVED', 'CLOSED', 'DISMISSED')
GROUP BY l.id, u.full_name, u.email, l.bar_registration_number, l.specialization, l.max_case_capacity;
```

### View 4: `v_financial_settlement_ledger`
Calculates cumulative payments, pending balances, and settlement satisfaction percentages:
```sql
CREATE OR REPLACE VIEW v_financial_settlement_ledger AS
SELECT 
  s.id AS settlement_id,
  s.case_id,
  c.case_reference_number,
  s.alimony_amount,
  s.child_support_monthly,
  s.status AS settlement_status,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0) AS total_paid,
  (s.alimony_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0)) AS balance_remaining,
  ROUND((COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0) / NULLIF(s.alimony_amount, 0)) * 100, 2) AS fulfillment_percentage
FROM settlements s
JOIN divorce_cases c ON s.case_id = c.id
LEFT JOIN payments p ON s.id = p.settlement_id
GROUP BY s.id, s.case_id, c.case_reference_number, s.alimony_amount, s.child_support_monthly, s.status;
```

---

## 14. Performance Indexes & Optimization Strategy
To guarantee sub-millisecond query execution on million-row workloads, composite B-tree indexes were engineered:
- `idx_cases_status_priority`: `CREATE INDEX idx_cases_status_priority ON divorce_cases (status, priority);` accelerates dashboard filters.
- `idx_hearings_lawyer_date`: `CREATE INDEX idx_hearings_lawyer_date ON hearings (lawyer_id, hearing_date);` optimizes advocate conflict checks.
- `idx_payments_settlement_date`: `CREATE INDEX idx_payments_settlement_date ON payments (settlement_id, payment_date);` expedites financial ledger aggregation.

---

## 15. The 16 Complex Demonstration SQL Queries
The project implements 16 advanced demonstration SQL queries stored in `sql/demonstration_queries.sql`:

1. **Query 1 (INNER JOIN + Multi-Table Linking)**: Complete case dossier joining `divorce_cases`, `clients`, `users`, and `lawyers`.
2. **Query 2 (LEFT OUTER JOIN)**: Lawyer roster showing advocates who currently have zero assigned active cases.
3. **Query 3 (Aggregate Functions + GROUP BY + HAVING)**: Jurisdictional court analysis identifying benches with higher-than-average caseloads.
4. **Query 4 (Correlated Subquery with EXISTS)**: Litigants who have active court hearings scheduled within the next 30 days.
5. **Query 5 (Correlated Subquery with NOT EXISTS)**: Decreed cases having approved settlements that possess zero recorded payment disbursements.
6. **Query 6 (Window Function: `ROW_NUMBER() OVER`)**: Enumerating historical status transitions partitioned by case and sorted chronologically.
7. **Query 7 (Window Function: `DENSE_RANK() OVER`)**: Ranking advocates across jurisdictions based on resolution counts.
8. **Query 8 (Window Function: `SUM() OVER` Cumulative Running Total)**: Financial disbursement timeline with running payment balance.
9. **Query 9 (Nested Subquery with `IN` / Set Membership)**: Identifying clients subject to contested cases alleging cruelty or desertion grounds.
10. **Query 10 (Multi-Condition CASE Expression)**: Triage classifier tagging cases as 'CRITICAL_INTERVENTION', 'HIGH_ATTENTION', or 'STANDARD'.
11. **Query 11 (Date Interval Arithmetics & Statutory Compliance)**: Identifying mutual-consent cases that have completed the 6-month cooling-off period under HMA 13B(2).
12. **Query 12 (Self-Join on Dual-Role Entities)**: Cross-examining cases where a single law firm or advocate represented opposing parties across different litigations.
13. **Query 13 (Subquery in FROM Clause / Derived Table)**: Calculating average alimony variance between mutual consent vs contested divorces.
14. **Query 14 (Multi-Level Aggregation & Cross-Table Filtering)**: Identifying lawyers handling cases involving minor children and joint custody agreements.
15. **Query 15 (Complex UNION Operator)**: Consolidated unified contact directory merging lawyers, petitioners, and respondents.
16. **Query 16 (Analytical View Utilization & Complex Predicates)**: High-exposure financial ledger reporting settlements with fulfillment below 50%.

---

## 16. MongoDB Aggregation Pipeline (`$facet`)
The system executes a high-performance multi-pipeline aggregation on MongoDB operational collections (`app/api/analytics/route.ts`):
```javascript
const documentPipeline = [
  {
    $facet: {
      typeBreakdown: [
        { $group: { _id: "$documentType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      confidentialityStats: [
        { $group: { _id: "$isConfidential", count: { $sum: 1 } } }
      ],
      storageMetrics: [
        { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" }, avgBytes: { $avg: "$sizeBytes" } } }
      ]
    }
  }
];
```

---

## 17. Advocate Schedule Conflict Detection Algorithm
To prevent double-booking of trial advocates, the hearing creation API (`app/api/hearings/route.ts`) implements a 45-minute temporal collision boundary:
```sql
SELECT h.id, h.hearing_date, h.courtroom_number, c.case_reference_number
FROM hearings h
JOIN divorce_cases c ON h.case_id = c.id
WHERE h.lawyer_id = $1
  AND h.outcome = 'SCHEDULED'
  AND h.hearing_date >= ($2::timestamp - INTERVAL '45 minutes')
  AND h.hearing_date <= ($2::timestamp + INTERVAL '45 minutes');
```
If this query returns rows, the API aborts with HTTP 409 Conflict, returning the colliding docket reference and courtroom number.

---

## 18. ACID Transactions & Concurrency Control
Multi-step operations are wrapped in strict ACID transaction blocks (`BEGIN ... COMMIT / ROLLBACK`):
1. **User Registration Transaction**: Creates `users` record and associated role-specific extension (`clients` or `lawyers`) atomically.
2. **Case Filing Transaction**: Generates case record, links petitioner and respondent, binds lead advocate, and inserts initial status history entry.
3. **Payment Disbursement Transaction**: Validates settlement existence, inserts `payments` record, updates settlement balance, and logs receipt in MongoDB.

---

## 19. Role-Based Access Control (RBAC) Matrix

| Feature / Resource | Administrator (`ADMIN`) | Advocate (`LAWYER`) | Litigant (`CLIENT`) |
|---|---|---|---|
| View All Cases Systemwide | Full Access | No (Only Assigned Cases) | No (Only Personal Case) |
| File New Divorce Case | Full Access | Full Access | Restricted |
| Schedule Court Hearing | Full Access | Assigned Cases Only | Read Only |
| Record Hearing Outcome | Full Access | Assigned Cases Only | No Access |
| Access Financial Ledger | Full Access | Assigned Cases Only | Personal Ledger Only |
| Record Settlement Payment | Full Access | Full Access | Self Payment Only |
| Manage User Accounts | Full Access | No Access | No Access |
| Semantic Precedent Explorer | Full Access | Full Access | Full Access |
| System Health & DB Diagnostic | Full Access | No Access | No Access |

---

## 20. API Route Architecture
- `POST /api/auth/login`: Issues HTTP-only JWT session cookie.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Validates session and returns user profile.
- `GET, POST /api/cases`: Case registry with ACID creation pipeline.
- `GET, PATCH /api/cases/[id]`: Deep case dossier with trigger status updates.
- `GET, POST /api/hearings`: Hearing docket with advocate conflict detection.
- `GET, POST /api/lawyers`: Advocate directory with workload metrics view.
- `GET, POST /api/settlements`: Settlement decrees and maintenance schedules.
- `GET, POST /api/payments`: Financial disbursement recorder.
- `GET, POST /api/custody`: Child welfare and custody schedules.
- `GET, POST /api/documents`: File upload and metadata storage.
- `POST /api/semantic-search`: pgvector cosine similarity retrieval.
- `GET /api/analytics`: Dual-database aggregated KPI dashboard.
- `GET /api/system/health`: Live connectivity check for PostgreSQL & MongoDB.

---

## 21. UI/UX Design System & Accessibility
The frontend is engineered with an aesthetic slate-950 dark theme inspired by modern enterprise legal software:
- **Color Palette**: Deep Obsidian (`#020617`), Card Glass Surface (`#0f172a`), Amber Gold Brand Accent (`#f59e0b`), Emerald Success (`#10b981`), Rose Critical Alert (`#f43f5e`).
- **Typography**: Clean tabular numbers and modern sans-serif fonts.
- **Interactive States**: Dynamic loading spinners, micro-animations, accessible modal dialogs, and toast notifications.
- **Role Navigation**: Sidebar automatically adjusts available navigation links based on user credentials.

---

## 22. Test Plan & Verification Results

| Test Case ID | Category | Description | Input / Trigger | Expected Outcome | Status |
|---|---|---|---|---|---|
| TC-DB-01 | DDL & Constraints | Unique case reference number constraint | Duplicate case reference insert | Database rejects with unique violation error | PASS |
| TC-DB-02 | Trigger | Status transition audit logging | `UPDATE divorce_cases SET status = 'MEDIATION'` | Row automatically inserted into `case_status_history` | PASS |
| TC-DB-03 | ACID | Case filing atomic rollback | Case insert fails halfway | Both client link and case insert rolled back | PASS |
| TC-API-01 | Conflict Detection | Advocate double-booking | Schedule 2 hearings for same lawyer 15 mins apart | HTTP 409 Conflict with collision details | PASS |
| TC-API-02 | RBAC | Litigant unauthorized route access | Client tries accessing `/api/users` | HTTP 403 Forbidden | PASS |
| TC-API-03 | Vector Search | Cosine similarity query | "waiver of 6 months waiting period" | Top result: *Amardeep Singh v. Harveen Kaur* | PASS |
| TC-FE-01 | Production Build | Turbopack compilation | `npm run build` | Zero TypeScript or prerender errors (35/35 pages) | PASS |

---

## 23. Setup & Installation Guide
1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables** (`.env`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/divorce_db"
   MONGODB_URI="mongodb://127.0.0.1:27017/divorce_management_system"
   JWT_SECRET="super-secret-dms-jwt-token-key-2026-secure"
   PORT=3000
   ```
   *(Note: If external PostgreSQL is not provided, the system automatically uses its embedded persistent PGlite engine in `./data/postgres`).*
3. **Run Database Migrations & Seeds**:
   ```bash
   npx prisma generate
   ```
   Execute `sql/schema.sql` and `sql/seed.sql` via your PostgreSQL console or trigger reset via the System Settings UI.
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 24. Conclusion & Future Enhancements
The Divorce Management System demonstrates how modern software engineering and rigorous database theory unite to solve complex legal sector workflows. By harmonizing 3NF relational modeling, trigger-based auditing, ACID transactions, MongoDB operational analytics, and pgvector semantic intelligence, DMS provides an exemplary template for a Level 3 university DBMS mini-project.

### Future Enhancements:
- Biometric e-signature integration for mutual consent agreements.
- Automated SMS/WhatsApp notifications for upcoming hearing dates.
- AI-driven speech-to-text court transcription directly tied into hearing notes.
