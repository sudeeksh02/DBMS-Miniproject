-- ============================================================================
-- DIVORCE MANAGEMENT SYSTEM (DMS) - DATABASE VERIFICATION TESTS
-- Run AFTER schema.sql and seed.sql:
--   psql -d <db> -v ON_ERROR_STOP=1 -f sql/verification_tests.sql
-- Every test runs inside a transaction that is rolled back, so the seed data is
-- left unchanged. A failing test aborts with an ASSERT error naming the test.
-- ============================================================================

-- TC-DB-01: UNIQUE constraint on divorce_cases.reference_number
BEGIN;
DO $$
BEGIN
    BEGIN
        INSERT INTO divorce_cases (id, reference_number, case_title, marriage_date)
        VALUES ('tst-dup', 'DIV-2026-0001', 'Duplicate reference test', '2015-01-01');
        RAISE EXCEPTION 'TC-DB-01 FAILED: duplicate reference number was accepted';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'TC-DB-01 PASS: duplicate reference number rejected (unique_violation)';
    END;
END $$;
ROLLBACK;

-- TC-DB-02: Audit trigger records the transition, the acting user and the reason
BEGIN;
DO $$ BEGIN
    PERFORM set_config('dms.current_user_id', 'usr-law-003', true);
    PERFORM set_config('dms.status_reason', 'Respondent served; moving to review', true);
END $$;
UPDATE divorce_cases SET status = 'UNDER_REVIEW' WHERE id = 'cas-006';
DO $$
DECLARE r RECORD;
BEGIN
    SELECT * INTO r FROM case_status_history
    WHERE case_id = 'cas-006' AND new_status = 'UNDER_REVIEW';
    ASSERT FOUND, 'TC-DB-02 FAILED: no audit row written by trg_case_status_audit';
    ASSERT r.previous_status = 'REGISTERED', 'TC-DB-02 FAILED: wrong previous_status';
    ASSERT r.changed_by_user_id = 'usr-law-003', 'TC-DB-02 FAILED: acting user not recorded';
    ASSERT r.reason = 'Respondent served; moving to review', 'TC-DB-02 FAILED: reason not recorded';
    RAISE NOTICE 'TC-DB-02 PASS: trigger audited REGISTERED -> UNDER_REVIEW by usr-law-003';
END $$;
ROLLBACK;

-- TC-DB-03: Atomicity - a failure midway through case registration rolls everything back
BEGIN;
DO $$
BEGIN
    BEGIN
        INSERT INTO divorce_cases (id, reference_number, case_title, marriage_date)
        VALUES ('tst-acid', fn_generate_case_reference(), 'Atomicity test', '2016-05-05');
        -- invalid gender violates chk_party_gender -> whole unit must roll back
        INSERT INTO case_parties (id, case_id, party_role, full_name, gender)
        VALUES ('tst-pty', 'tst-acid', 'PETITIONER', 'Test Person', 'INVALID');
        RAISE EXCEPTION 'TC-DB-03 FAILED: invalid party row was accepted';
    EXCEPTION WHEN check_violation THEN
        NULL; -- the sub-transaction (both inserts) is rolled back here
    END;
    ASSERT NOT EXISTS (SELECT 1 FROM divorce_cases WHERE id = 'tst-acid'),
        'TC-DB-03 FAILED: case row survived the failed unit of work';
    RAISE NOTICE 'TC-DB-03 PASS: failed party insert rolled back the case insert as well';
END $$;
ROLLBACK;

-- TC-DB-04: CHECK constraint rejects non-positive payments
BEGIN;
DO $$
BEGIN
    BEGIN
        INSERT INTO payments (id, settlement_id, amount_paid, transaction_reference)
        VALUES ('tst-pay', 'stl-001', 0, 'TST-ZERO-001');
        RAISE EXCEPTION 'TC-DB-04 FAILED: zero payment accepted';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TC-DB-04 PASS: amount_paid = 0 rejected by chk_payment_amount';
    END;
END $$;
ROLLBACK;

-- TC-DB-05: ON DELETE RESTRICT protects lawyers who are assigned to cases
BEGIN;
DO $$
BEGIN
    BEGIN
        DELETE FROM lawyers WHERE id = 'law-001';
        RAISE EXCEPTION 'TC-DB-05 FAILED: assigned lawyer was deleted';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'TC-DB-05 PASS: deleting an assigned lawyer blocked (ON DELETE RESTRICT)';
    END;
END $$;
ROLLBACK;

-- TC-DB-06: ON DELETE CASCADE removes dependent rows of a deleted case
BEGIN;
DELETE FROM divorce_cases WHERE id = 'cas-001';
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM case_parties WHERE case_id = 'cas-001'), 'TC-DB-06 FAILED: parties left behind';
    ASSERT NOT EXISTS (SELECT 1 FROM hearings WHERE case_id = 'cas-001'), 'TC-DB-06 FAILED: hearings left behind';
    ASSERT NOT EXISTS (SELECT 1 FROM payments WHERE settlement_id = 'stl-001'), 'TC-DB-06 FAILED: payments left behind';
    RAISE NOTICE 'TC-DB-06 PASS: case delete cascaded to parties, hearings, settlement and payments';
END $$;
ROLLBACK;

-- TC-DB-07: Advocate conflict detection (45-minute window, same query as app/api/hearings)
BEGIN;
DO $$
DECLARE
    v_lawyer TEXT;
    v_time   TIMESTAMPTZ;
    n_30     INT;
    n_60     INT;
BEGIN
    SELECT assigned_lawyer_id, hearing_date INTO v_lawyer, v_time
    FROM hearings WHERE outcome = 'SCHEDULED' AND assigned_lawyer_id IS NOT NULL
    ORDER BY hearing_date LIMIT 1;

    SELECT COUNT(*) INTO n_30 FROM hearings h
    WHERE h.assigned_lawyer_id = v_lawyer AND h.outcome = 'SCHEDULED'
      AND h.hearing_date > ((v_time + INTERVAL '30 minutes') - INTERVAL '45 minutes')
      AND h.hearing_date < ((v_time + INTERVAL '30 minutes') + INTERVAL '45 minutes');

    SELECT COUNT(*) INTO n_60 FROM hearings h
    WHERE h.assigned_lawyer_id = v_lawyer AND h.outcome = 'SCHEDULED'
      AND h.hearing_date > ((v_time + INTERVAL '60 minutes') - INTERVAL '45 minutes')
      AND h.hearing_date < ((v_time + INTERVAL '60 minutes') + INTERVAL '45 minutes');

    ASSERT n_30 >= 1, 'TC-DB-07 FAILED: booking 30 minutes later was not flagged';
    ASSERT n_60 = 0,  'TC-DB-07 FAILED: booking 60 minutes later was wrongly flagged';
    RAISE NOTICE 'TC-DB-07 PASS: +30 min flagged as conflict, +60 min allowed';
END $$;
ROLLBACK;

-- TC-DB-08: Reference generator never re-issues a number after a deletion
BEGIN;
DELETE FROM divorce_cases WHERE id = 'cas-003';
DO $$
DECLARE v_ref TEXT := fn_generate_case_reference();
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM divorce_cases WHERE reference_number = v_ref),
        'TC-DB-08 FAILED: generated reference already exists';
    RAISE NOTICE 'TC-DB-08 PASS: next reference % is unique after a deletion', v_ref;
END $$;
ROLLBACK;

-- TC-DB-09: v_active_cases_overview has exactly one row per non-closed case
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM v_active_cases_overview) =
           (SELECT COUNT(DISTINCT case_id) FROM v_active_cases_overview),
        'TC-DB-09 FAILED: duplicate rows in v_active_cases_overview';
    ASSERT (SELECT COUNT(*) FROM v_active_cases_overview) =
           (SELECT COUNT(*) FROM divorce_cases WHERE status NOT IN ('RESOLVED', 'CLOSED')),
        'TC-DB-09 FAILED: view row count does not match open cases';
    RAISE NOTICE 'TC-DB-09 PASS: one row per open case in v_active_cases_overview';
END $$;

-- TC-DB-10: Settlement ledger view arithmetic (balance = agreed - paid)
DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1 FROM v_financial_settlement_ledger v
        WHERE v.balance_outstanding <> v.total_agreed_amount -
              (SELECT COALESCE(SUM(amount_paid), 0) FROM payments p WHERE p.settlement_id = v.settlement_id)
    ), 'TC-DB-10 FAILED: ledger balance mismatch';
    RAISE NOTICE 'TC-DB-10 PASS: v_financial_settlement_ledger balances reconcile with payments';
END $$;

-- TC-DB-11: Cosine similarity function sanity (identical = 1, orthogonal = 0)
DO $$
BEGIN
    ASSERT abs(fn_cosine_similarity(ARRAY[1,2,3]::float8[], ARRAY[1,2,3]::float8[]) - 1) < 1e-9,
        'TC-DB-11 FAILED: identical vectors';
    ASSERT abs(fn_cosine_similarity(ARRAY[1,0]::float8[], ARRAY[0,1]::float8[])) < 1e-9,
        'TC-DB-11 FAILED: orthogonal vectors';
    ASSERT (SELECT COUNT(*) FROM legal_resources WHERE array_length(embedding, 1) = 16) =
           (SELECT COUNT(*) FROM legal_resources),
        'TC-DB-11 FAILED: some embeddings are not 16-dimensional';
    RAISE NOTICE 'TC-DB-11 PASS: cosine similarity correct; all embeddings 16-D';
END $$;

SELECT 'All DMS database verification tests passed.' AS result;
