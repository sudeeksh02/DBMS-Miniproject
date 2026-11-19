-- ============================================================================
-- DIVORCE MANAGEMENT SYSTEM (DMS) - RELATIONAL DATABASE SCHEMA (DDL)
-- University DBMS Project - Level 3 Academic Standard
-- Target Engine: PostgreSQL 16+ (Normalized 3NF Architecture)
-- ============================================================================

-- No extensions required: IDs are application-generated VARCHAR keys, and vector search
-- uses the PL/pgSQL fn_cosine_similarity() below. This keeps the script runnable on the
-- embedded PGlite engine, which does not ship contrib extensions such as uuid-ossp by default.

-- ============================================================================
-- 1. DOMAIN INTEGRITY APPROACH
-- ============================================================================

-- Domain integrity is enforced with CHECK constraints on VARCHAR columns (see each table),
-- e.g. CHECK (status IN ('REGISTERED', ...)). CHECK lists can be extended with a single
-- ALTER TABLE, unlike ENUM types, and they behave identically on PostgreSQL and PGlite.

-- ============================================================================
-- 2. BASE ENTITY TABLES
-- ============================================================================

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(25),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'LAWYER', 'CLIENT'))
);

-- TABLE: lawyers
CREATE TABLE IF NOT EXISTS lawyers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    bar_registration_number VARCHAR(50) NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL DEFAULT 'Family Law',
    years_experience INT NOT NULL DEFAULT 1,
    office_address TEXT,
    hourly_rate NUMERIC(10, 2) DEFAULT 1500.00,
    max_case_capacity INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lawyer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_lawyer_exp CHECK (years_experience >= 0),
    CONSTRAINT chk_lawyer_rate CHECK (hourly_rate >= 0),
    CONSTRAINT chk_lawyer_capacity CHECK (max_case_capacity BETWEEN 1 AND 50)
);

-- TABLE: clients
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    national_id VARCHAR(50) UNIQUE,
    address TEXT,
    occupation VARCHAR(100),
    annual_income NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_client_income CHECK (annual_income >= 0)
);

-- TABLE: divorce_cases
CREATE TABLE IF NOT EXISTS divorce_cases (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(30) NOT NULL UNIQUE,
    case_title VARCHAR(255) NOT NULL,
    divorce_category VARCHAR(100) NOT NULL DEFAULT 'Mutual Consent',
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    marriage_date DATE NOT NULL,
    marriage_place VARCHAR(150),
    separation_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    priority VARCHAR(15) NOT NULL DEFAULT 'MEDIUM',
    presiding_court VARCHAR(150) NOT NULL DEFAULT 'Family Court Division 1',
    resolution_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_case_status CHECK (status IN (
        'REGISTERED', 'UNDER_REVIEW', 'DOCUMENTATION_PENDING', 'MEDIATION',
        'HEARING_SCHEDULED', 'SETTLEMENT_NEGOTIATION', 'AWAITING_FINAL_ORDER',
        'RESOLVED', 'CLOSED'
    )),
    CONSTRAINT chk_case_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_marriage_dates CHECK (marriage_date <= filing_date),
    CONSTRAINT chk_separation_date CHECK (separation_date IS NULL OR separation_date >= marriage_date),
    CONSTRAINT chk_resolution_date CHECK (resolution_date IS NULL OR resolution_date >= filing_date)
);

-- TABLE: case_parties
CREATE TABLE IF NOT EXISTS case_parties (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36),
    party_role VARCHAR(15) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) DEFAULT 'OTHER',
    date_of_birth DATE,
    email VARCHAR(255),
    phone_number VARCHAR(25),
    current_address TEXT,
    employment VARCHAR(100),
    monthly_income NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_party_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_party_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT uq_case_party_role UNIQUE (case_id, party_role),
    CONSTRAINT chk_party_role CHECK (party_role IN ('PETITIONER', 'RESPONDENT')),
    CONSTRAINT chk_party_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_party_income CHECK (monthly_income >= 0)
);

-- TABLE: case_lawyers
CREATE TABLE IF NOT EXISTS case_lawyers (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    lawyer_id VARCHAR(36) NOT NULL,
    representing_role VARCHAR(15) NOT NULL DEFAULT 'PETITIONER',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_lead_counsel BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_caselawyer_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_caselawyer_lawyer FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_case_lawyer_role UNIQUE (case_id, lawyer_id, representing_role),
    CONSTRAINT chk_caselawyer_role CHECK (representing_role IN ('PETITIONER', 'RESPONDENT'))
);

-- TABLE: hearings
CREATE TABLE IF NOT EXISTS hearings (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    assigned_lawyer_id VARCHAR(36),
    hearing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    court_room VARCHAR(50) NOT NULL DEFAULT 'Court Hall 3',
    judge_name VARCHAR(100) NOT NULL DEFAULT 'Hon. Justice M. Rao',
    hearing_type VARCHAR(30) NOT NULL DEFAULT 'PRELIMINARY',
    outcome VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    summary_notes TEXT,
    next_hearing_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hearing_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_hearing_lawyer FOREIGN KEY (assigned_lawyer_id) REFERENCES lawyers(id) ON DELETE SET NULL,
    CONSTRAINT chk_hearing_type CHECK (hearing_type IN (
        'PRELIMINARY', 'MEDIATION_SESSION', 'EVIDENCE_PRESENTATION',
        'CROSS_EXAMINATION', 'FINAL_ARGUMENTS', 'JUDGMENT_PRONOUNCEMENT'
    )),
    CONSTRAINT chk_hearing_outcome CHECK (outcome IN (
        'SCHEDULED', 'ADJOURNED', 'SETTLEMENT_REACHED', 'ORDER_PASSED', 'DISMISSED', 'CONCLUDED'
    )),
    CONSTRAINT chk_next_hearing CHECK (next_hearing_date IS NULL OR next_hearing_date > hearing_date)
);

-- TABLE: settlements
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL UNIQUE,
    settlement_type VARCHAR(30) NOT NULL DEFAULT 'LUMP_SUM',
    total_agreed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_alimony NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    alimony_tenure_months INT NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    terms_conditions TEXT,
    settlement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_settlement_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE,
    CONSTRAINT chk_settlement_type CHECK (settlement_type IN (
        'LUMP_SUM', 'MONTHLY_ALIMONY', 'CHILD_SUPPORT', 'PROPERTY_DIVISION', 'HYBRID'
    )),
    CONSTRAINT chk_settlement_status CHECK (payment_status IN (
        'PENDING', 'PARTIALLY_PAID', 'COMPLETED', 'DEFAULTED'
    )),
    CONSTRAINT chk_settlement_amounts CHECK (total_agreed_amount >= 0 AND monthly_alimony >= 0 AND alimony_tenure_months >= 0)
);

-- TABLE: payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    settlement_id VARCHAR(36) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    receipt_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount_paid > 0)
);

-- TABLE: custody_arrangements
CREATE TABLE IF NOT EXISTS custody_arrangements (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL UNIQUE,
    custody_type VARCHAR(30) NOT NULL DEFAULT 'JOINT_LEGAL',
    number_of_children INT NOT NULL DEFAULT 1,
    children_details TEXT,
    visitation_schedule TEXT,
    monthly_support_amount NUMERIC(10, 2) DEFAULT 0.00,
    special_conditions TEXT,
    is_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_custody_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE,
    CONSTRAINT chk_custody_type CHECK (custody_type IN (
        'SOLE_PETITIONER', 'SOLE_RESPONDENT', 'JOINT_LEGAL', 'SHARED_PHYSICAL', 'THIRD_PARTY_GUARDIAN'
    )),
    CONSTRAINT chk_children_count CHECK (number_of_children >= 1),
    CONSTRAINT chk_support_amount CHECK (monthly_support_amount >= 0)
);

-- TABLE: case_status_history
CREATE TABLE IF NOT EXISTS case_status_history (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user_id VARCHAR(36),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_case FOREIGN KEY (case_id) REFERENCES divorce_cases(id) ON DELETE CASCADE
);

-- TABLE: legal_resources (vector semantic search; 16-D embeddings stored as FLOAT8[])
CREATE TABLE IF NOT EXISTS legal_resources (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'STATUTE',
    citation VARCHAR(100),
    content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[],
    embedding FLOAT8[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

-- (reference_number is already indexed by its UNIQUE constraint)
-- (status lookups use the leading column of idx_cases_status_priority below)
CREATE INDEX IF NOT EXISTS idx_cases_filing_date ON divorce_cases(filing_date);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON divorce_cases(priority);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON hearings(case_id);
-- (lawyer lookups on hearings are served by the composite idx_hearings_lawyer_date below)
CREATE INDEX IF NOT EXISTS idx_case_lawyers_lawyer ON case_lawyers(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_case ON case_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_client ON case_parties(client_id);
-- (settlement_id lookups use the leading column of idx_payments_settlement_date below)
CREATE INDEX IF NOT EXISTS idx_status_history_case ON case_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_resources_category ON legal_resources(category);

-- Composite B-tree indexes
-- (status, priority): dashboard / case-registry filters on both columns
CREATE INDEX IF NOT EXISTS idx_cases_status_priority ON divorce_cases(status, priority);
-- (assigned_lawyer_id, hearing_date): advocate conflict-detection range scan
CREATE INDEX IF NOT EXISTS idx_hearings_lawyer_date ON hearings(assigned_lawyer_id, hearing_date);
-- (settlement_id, payment_date): ledger aggregation and running-total queries
CREATE INDEX IF NOT EXISTS idx_payments_settlement_date ON payments(settlement_id, payment_date);

-- ============================================================================
-- 4. VIEWS (DATABASE ABSTRACTION & REPORTING)
-- ============================================================================

-- VIEW 1: Active Cases Overview (Aggregating parties, lead lawyer, status)
CREATE OR REPLACE VIEW v_active_cases_overview AS
SELECT 
    c.id AS case_id,
    c.reference_number,
    c.case_title,
    c.divorce_category,
    c.status,
    c.priority,
    c.filing_date,
    c.presiding_court,
    petitioner.full_name AS petitioner_name,
    respondent.full_name AS respondent_name,
    u_lawyer.full_name AS lead_lawyer_name,
    l.bar_registration_number AS lead_lawyer_bar_reg,
    COUNT(h.id) AS total_hearings_count
FROM divorce_cases c
LEFT JOIN case_parties petitioner
    ON c.id = petitioner.case_id AND petitioner.party_role = 'PETITIONER'
LEFT JOIN case_parties respondent
    ON c.id = respondent.case_id AND respondent.party_role = 'RESPONDENT'
-- One lead counsel per case (petitioner's counsel preferred) so cases with
-- counsel on both sides are not duplicated and hearings are not double-counted
LEFT JOIN LATERAL (
    SELECT cl.lawyer_id
    FROM case_lawyers cl
    WHERE cl.case_id = c.id AND cl.is_lead_counsel = TRUE AND cl.is_active = TRUE
    ORDER BY (cl.representing_role = 'PETITIONER') DESC, cl.assigned_at ASC
    LIMIT 1
) lead ON TRUE
LEFT JOIN lawyers l
    ON lead.lawyer_id = l.id
LEFT JOIN users u_lawyer
    ON l.user_id = u_lawyer.id
LEFT JOIN hearings h
    ON c.id = h.case_id
WHERE c.status NOT IN ('RESOLVED', 'CLOSED')
GROUP BY
    c.id, c.reference_number, c.case_title, c.divorce_category, c.status,
    c.priority, c.filing_date, c.presiding_court, petitioner.full_name,
    respondent.full_name, u_lawyer.full_name, l.bar_registration_number;

-- VIEW 2: Upcoming Hearings Summary
CREATE OR REPLACE VIEW v_upcoming_hearings_summary AS
SELECT 
    h.id AS hearing_id,
    h.case_id,
    c.reference_number,
    c.case_title,
    c.status AS case_status,
    h.hearing_date,
    h.court_room,
    h.judge_name,
    h.hearing_type,
    h.outcome,
    u.full_name AS assigned_lawyer_name,
    u.phone_number AS lawyer_phone
FROM hearings h
JOIN divorce_cases c ON h.case_id = c.id
LEFT JOIN lawyers l ON h.assigned_lawyer_id = l.id
LEFT JOIN users u ON l.user_id = u.id
WHERE h.outcome = 'SCHEDULED'
ORDER BY h.hearing_date ASC;

-- VIEW 3: Lawyer Workload and Capacity Metrics
CREATE OR REPLACE VIEW v_lawyer_workload_metrics AS
SELECT 
    l.id AS lawyer_id,
    u.full_name AS lawyer_name,
    l.bar_registration_number,
    l.specialization,
    l.max_case_capacity,
    COUNT(DISTINCT cl.case_id) FILTER (WHERE cl.is_active = TRUE AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS active_cases_count,
    ROUND((COUNT(DISTINCT cl.case_id) FILTER (WHERE cl.is_active = TRUE AND c.status NOT IN ('RESOLVED', 'CLOSED'))::numeric / NULLIF(l.max_case_capacity, 0)) * 100, 1) AS capacity_utilization_pct,
    COUNT(DISTINCT h.id) FILTER (WHERE h.outcome = 'SCHEDULED') AS pending_hearings_count
FROM lawyers l
JOIN users u ON l.user_id = u.id
LEFT JOIN case_lawyers cl ON l.id = cl.lawyer_id
LEFT JOIN divorce_cases c ON cl.case_id = c.id
LEFT JOIN hearings h ON l.id = h.assigned_lawyer_id
GROUP BY l.id, u.full_name, l.bar_registration_number, l.specialization, l.max_case_capacity;

-- VIEW 4: Financial Settlement Ledger Overview
CREATE OR REPLACE VIEW v_financial_settlement_ledger AS
SELECT 
    s.id AS settlement_id,
    s.case_id,
    c.reference_number,
    c.case_title,
    s.settlement_type,
    s.total_agreed_amount,
    s.monthly_alimony,
    s.alimony_tenure_months,
    s.payment_status,
    COALESCE(SUM(p.amount_paid), 0) AS total_amount_paid,
    (s.total_agreed_amount - COALESCE(SUM(p.amount_paid), 0)) AS balance_outstanding,
    COUNT(p.id) AS total_transactions_count,
    MAX(p.payment_date) AS latest_payment_date
FROM settlements s
JOIN divorce_cases c ON s.case_id = c.id
LEFT JOIN payments p ON s.id = p.settlement_id
GROUP BY s.id, s.case_id, c.reference_number, c.case_title, s.settlement_type,
         s.total_agreed_amount, s.monthly_alimony, s.alimony_tenure_months, s.payment_status;

-- ============================================================================
-- 5. FUNCTIONS & STORED PROCEDURES
-- ============================================================================

-- Function to generate standardized sequential Case Reference Numbers: DIV-YYYY-XXXX
CREATE OR REPLACE FUNCTION fn_generate_case_reference()
RETURNS VARCHAR AS $$
DECLARE
    v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_count INT;
    v_new_ref VARCHAR;
BEGIN
    -- MAX(suffix)+1 rather than COUNT(*)+1, so deleting a case can never cause
    -- a duplicate reference number (UNIQUE violation) on the next registration
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM '^DIV-[0-9]{4}-([0-9]+)$') AS INT)), 0) + 1
    INTO v_count
    FROM divorce_cases
    WHERE reference_number LIKE 'DIV-' || v_year || '-%';
    
    v_new_ref := 'DIV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    RETURN v_new_ref;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cosine similarity between two vector float arrays
CREATE OR REPLACE FUNCTION fn_cosine_similarity(a FLOAT8[], b FLOAT8[])
RETURNS FLOAT8 AS $$
DECLARE
    dot_product FLOAT8 := 0.0;
    norm_a FLOAT8 := 0.0;
    norm_b FLOAT8 := 0.0;
    i INT;
    len INT;
BEGIN
    IF a IS NULL OR b IS NULL THEN
        RETURN 0.0;
    END IF;
    len := LEAST(array_length(a, 1), array_length(b, 1));
    IF len IS NULL OR len = 0 THEN
        RETURN 0.0;
    END IF;

    FOR i IN 1..len LOOP
        dot_product := dot_product + (a[i] * b[i]);
        norm_a := norm_a + (a[i] * a[i]);
        norm_b := norm_b + (b[i] * b[i]);
    END LOOP;

    IF norm_a = 0.0 OR norm_b = 0.0 THEN
        RETURN 0.0;
    END IF;

    RETURN dot_product / (SQRT(norm_a) * SQRT(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- STORED PROCEDURES (CREATE PROCEDURE ... invoked with CALL)
-- Unlike functions, procedures are called with CALL, return no value, and bundle
-- a whole business operation (validation + several writes) into one atomic unit.
-- Each CALL runs in a single transaction: if any RAISE EXCEPTION fires, every
-- change made by the procedure is rolled back.
-- ----------------------------------------------------------------------------

-- Procedure 1: Move a case to a new lifecycle status.
-- The audit row itself is written by trigger trg_case_status_audit; this procedure
-- hands it the acting user and reason through transaction-local settings.
-- Usage: CALL sp_update_case_status('<case_id>', 'MEDIATION', '<user_id>', 'Parties agreed to mediation');
CREATE OR REPLACE PROCEDURE sp_update_case_status(
    p_case_id    VARCHAR,
    p_new_status VARCHAR,
    p_user_id    VARCHAR,
    p_reason     TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR(30);
BEGIN
    SELECT status INTO v_old_status FROM divorce_cases WHERE id = p_case_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Case % not found', p_case_id;
    END IF;

    IF v_old_status = p_new_status THEN
        RAISE EXCEPTION 'Case is already in status %', p_new_status;
    END IF;

    -- Seen by fn_trg_case_status_audit(); "true" = local to this transaction only
    PERFORM set_config('dms.current_user_id', COALESCE(p_user_id, ''), true);
    PERFORM set_config('dms.status_reason', COALESCE(p_reason, ''), true);

    UPDATE divorce_cases
    SET status = p_new_status,
        resolution_date = CASE
            WHEN p_new_status IN ('RESOLVED', 'CLOSED') THEN COALESCE(resolution_date, CURRENT_DATE)
            ELSE resolution_date
        END
    WHERE id = p_case_id;   -- CHECK constraint rejects an invalid status here

    RAISE NOTICE 'Case % moved from % to %', p_case_id, v_old_status, p_new_status;
END;
$$;

-- Procedure 2: Record a payment and recompute the settlement's payment_status.
-- Usage: CALL sp_record_payment('<settlement_id>', 25000, 'Bank Transfer', 'TXN-1001');
CREATE OR REPLACE PROCEDURE sp_record_payment(
    p_settlement_id VARCHAR,
    p_amount        NUMERIC,
    p_method        VARCHAR,
    p_reference     VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_agreed NUMERIC;
    v_total_paid   NUMERIC;
    v_new_status   VARCHAR(20);
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive (got %)', p_amount;
    END IF;

    SELECT total_agreed_amount INTO v_total_agreed
    FROM settlements WHERE id = p_settlement_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Settlement % not found', p_settlement_id;
    END IF;

    INSERT INTO payments (id, settlement_id, amount_paid, payment_method, transaction_reference)
    VALUES (
        'pay-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
        p_settlement_id, p_amount, COALESCE(p_method, 'Bank Transfer'), p_reference
    );   -- duplicate p_reference violates the UNIQUE constraint and aborts the call

    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
    FROM payments WHERE settlement_id = p_settlement_id;

    IF v_total_agreed > 0 AND v_total_paid >= v_total_agreed THEN
        v_new_status := 'COMPLETED';
    ELSE
        v_new_status := 'PARTIALLY_PAID';
    END IF;

    UPDATE settlements SET payment_status = v_new_status WHERE id = p_settlement_id;

    RAISE NOTICE 'Settlement %: paid % of % -> %', p_settlement_id, v_total_paid, v_total_agreed, v_new_status;
END;
$$;

-- Procedure 3: Schedule a hearing with lawyer conflict detection.
-- The range predicate is served by the composite B-tree idx_hearings_lawyer_date.
-- Usage: CALL sp_schedule_hearing('<case_id>', '<lawyer_id>', '2026-12-01 10:30+05:30', 'PRELIMINARY');
CREATE OR REPLACE PROCEDURE sp_schedule_hearing(
    p_case_id      VARCHAR,
    p_lawyer_id    VARCHAR,
    p_hearing_date TIMESTAMP WITH TIME ZONE,
    p_hearing_type VARCHAR DEFAULT 'PRELIMINARY'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_clash TIMESTAMP WITH TIME ZONE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM divorce_cases WHERE id = p_case_id) THEN
        RAISE EXCEPTION 'Case % not found', p_case_id;
    END IF;

    IF p_lawyer_id IS NOT NULL THEN
        SELECT hearing_date INTO v_clash
        FROM hearings
        WHERE assigned_lawyer_id = p_lawyer_id
          AND outcome = 'SCHEDULED'
          AND hearing_date > p_hearing_date - INTERVAL '45 minutes'
          AND hearing_date < p_hearing_date + INTERVAL '45 minutes'
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'CONFLICTING_SCHEDULE: lawyer already has a hearing at % (within 45 minutes)', v_clash;
        END IF;
    END IF;

    INSERT INTO hearings (id, case_id, assigned_lawyer_id, hearing_date, hearing_type)
    VALUES (
        'hrg-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
        p_case_id, p_lawyer_id, p_hearing_date, p_hearing_type
    );

    RAISE NOTICE 'Hearing scheduled for case % at %', p_case_id, p_hearing_date;
END;
$$;

-- ============================================================================
-- 6. DATABASE TRIGGERS
-- ============================================================================

-- Trigger Function: Automatically record status transitions into case_status_history
CREATE OR REPLACE FUNCTION fn_trg_case_status_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO case_status_history (
            id,
            case_id,
            previous_status,
            new_status,
            changed_by_user_id,
            reason,
            changed_at
        ) VALUES (
            'hist-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
            NEW.id,
            OLD.status,
            NEW.status,
            -- Acting user / reason are passed in by the application via transaction-local
            -- settings (set_config(..., true)); falls back to SYSTEM_AUTO for direct SQL updates
            COALESCE(NULLIF(current_setting('dms.current_user_id', true), ''), 'SYSTEM_AUTO'),
            COALESCE(
                NULLIF(current_setting('dms.status_reason', true), ''),
                'Automated trigger status transition recorded from ' || OLD.status || ' to ' || NEW.status
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_case_status_audit ON divorce_cases;
CREATE TRIGGER trg_case_status_audit
AFTER UPDATE OF status ON divorce_cases
FOR EACH ROW
EXECUTE FUNCTION fn_trg_case_status_audit();

-- Trigger Function: Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION fn_trg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_timestamp ON users;
CREATE TRIGGER trg_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_timestamp();

DROP TRIGGER IF EXISTS trg_cases_timestamp ON divorce_cases;
CREATE TRIGGER trg_cases_timestamp
BEFORE UPDATE ON divorce_cases
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_timestamp();

DROP TRIGGER IF EXISTS trg_settlements_timestamp ON settlements;
CREATE TRIGGER trg_settlements_timestamp
BEFORE UPDATE ON settlements
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_timestamp();
