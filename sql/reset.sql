-- ============================================================================
-- DIVORCE MANAGEMENT SYSTEM (DMS) - DEVELOPMENT DATABASE RESET SCRIPT
-- WARNING: DESTRUCTIVE SCRIPT - FOR DEVELOPMENT & TEST BENCHMARKING ONLY
-- Drops all application views, triggers, functions, and relational tables in dependency order
-- ============================================================================

-- 1. Drop Views
DROP VIEW IF EXISTS v_financial_settlement_ledger CASCADE;
DROP VIEW IF EXISTS v_lawyer_workload_metrics CASCADE;
DROP VIEW IF EXISTS v_upcoming_hearings_summary CASCADE;
DROP VIEW IF EXISTS v_active_cases_overview CASCADE;

-- 2. Drop Triggers & Trigger Functions
DROP TRIGGER IF EXISTS trg_case_status_audit ON divorce_cases;
DROP FUNCTION IF EXISTS fn_trg_case_status_audit() CASCADE;

DROP TRIGGER IF EXISTS trg_users_timestamp ON users;
DROP TRIGGER IF EXISTS trg_cases_timestamp ON divorce_cases;
DROP TRIGGER IF EXISTS trg_settlements_timestamp ON settlements;
DROP FUNCTION IF EXISTS fn_trg_update_timestamp() CASCADE;

-- 3. Drop Custom Functions & Stored Procedures
DROP FUNCTION IF EXISTS fn_generate_case_reference() CASCADE;
DROP FUNCTION IF EXISTS fn_cosine_similarity(FLOAT8[], FLOAT8[]) CASCADE;

-- 4. Drop Tables in Foreign Key Dependency Order
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS custody_arrangements CASCADE;
DROP TABLE IF EXISTS hearings CASCADE;
DROP TABLE IF EXISTS case_lawyers CASCADE;
DROP TABLE IF EXISTS case_parties CASCADE;
DROP TABLE IF EXISTS case_status_history CASCADE;
DROP TABLE IF EXISTS divorce_cases CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS lawyers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS legal_resources CASCADE;

-- 5. Drop Custom Types (Enums)
DROP TYPE IF EXISTS custody_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS settlement_type CASCADE;
DROP TYPE IF EXISTS hearing_outcome CASCADE;
DROP TYPE IF EXISTS hearing_type CASCADE;
DROP TYPE IF EXISTS party_role CASCADE;
DROP TYPE IF EXISTS case_priority CASCADE;
DROP TYPE IF EXISTS case_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Confirmation Notice
SELECT 'DMS Relational Schema Successfully Reset.' AS status;
