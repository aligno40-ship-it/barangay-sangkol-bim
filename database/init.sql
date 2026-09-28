-- ============================================================================
-- BARANGAY SANGKOL MANAGEMENT & INFORMATION SYSTEM (BS-MIS)
-- CONSOLIDATED ALL-IN-ONE POSTGRESQL INITIALIZATION SCRIPT (init.sql)
-- Location: Barangay Sangkol, City of Dipolog, Zamboanga del Norte, Philippines
-- Usage:
--   psql -U postgres -d barangay_sangkol_db -f init.sql
--   or run directly in pgAdmin 4 / DBeaver / VS Code PostgreSQL Extension
-- ============================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
SET timezone = 'Asia/Manila';

-- Drop existing views & tables if re-initializing cleanly
DROP VIEW IF EXISTS v_lupon_settlement_rate CASCADE;
DROP VIEW IF EXISTS v_monthly_revenue CASCADE;
DROP VIEW IF EXISTS v_purok_population CASCADE;
DROP VIEW IF EXISTS v_demographic_summary CASCADE;

DROP TABLE IF EXISTS system_notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS concern_action_logs CASCADE;
DROP TABLE IF EXISTS citizen_concerns CASCADE;
DROP TABLE IF EXISTS activity_attendees CASCADE;
DROP TABLE IF EXISTS community_activities CASCADE;
DROP TABLE IF EXISTS announcement_attendees CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS blotter_activity_logs CASCADE;
DROP TABLE IF EXISTS blotters CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS barangay_officials CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS system_users CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS barangay_settings CASCADE;

-- ============================================================================
-- 2. DDL SCHEMA DEFINITIONS
-- ============================================================================

-- 2.1 BARANGAY SETTINGS
CREATE TABLE barangay_settings (
    id SERIAL PRIMARY KEY,
    barangay_name VARCHAR(150) NOT NULL DEFAULT 'Barangay Sangkol',
    municipality VARCHAR(150) NOT NULL DEFAULT 'City of Dipolog',
    province VARCHAR(150) NOT NULL DEFAULT 'Province of Zamboanga del Norte',
    region VARCHAR(150) NOT NULL DEFAULT 'Region IX - Zamboanga Peninsula',
    zip_code VARCHAR(20) NOT NULL DEFAULT '7100',
    punong_barangay VARCHAR(150) NOT NULL,
    barangay_captain VARCHAR(150),
    barangay_secretary VARCHAR(150) NOT NULL,
    barangay_treasurer VARCHAR(150) NOT NULL,
    sk_chairperson VARCHAR(150),
    kagawads TEXT[] DEFAULT ARRAY[]::TEXT[],
    contact_number VARCHAR(100),
    email VARCHAR(150),
    hall_address TEXT,
    office_hours VARCHAR(150),
    clearance_fee_regular NUMERIC(10, 2) DEFAULT 50.00,
    business_clearance_fee NUMERIC(10, 2) DEFAULT 300.00,
    residency_cert_fee NUMERIC(10, 2) DEFAULT 50.00,
    indigency_cert_fee NUMERIC(10, 2) DEFAULT 0.00,
    good_moral_fee NUMERIC(10, 2) DEFAULT 50.00,
    puroks TEXT[] DEFAULT ARRAY['Purok Pinya', 'Purok Lumboy', 'Purok Mangga', 'Purok Tambis', 'Purok Kaimito', 'Purok Bayabas'],
    term_start DATE,
    term_end DATE,
    tagline TEXT,
    captain_signature_url TEXT,
    logo_url TEXT,
    republic_logo_url TEXT,
    theme VARCHAR(50) DEFAULT 'light',
    is_dark_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 RESIDENTS (Registry of Barangay Inhabitants - RBI Form 1A)
CREATE TABLE residents (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    alias VARCHAR(100),
    birth_date DATE NOT NULL,
    age INT GENERATED ALWAYS AS (DATE_PART('year', AGE(CURRENT_DATE, birth_date))) STORED,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female')),
    civil_status VARCHAR(30) NOT NULL CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Common Law')),
    purok VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    occupation VARCHAR(100) DEFAULT 'Unemployed',
    monthly_income NUMERIC(12, 2) DEFAULT 0.00,
    citizenship VARCHAR(100) DEFAULT 'Filipino',
    religion VARCHAR(100) DEFAULT 'Roman Catholic',
    blood_type VARCHAR(10) DEFAULT 'Unknown',
    educational_attainment VARCHAR(100) DEFAULT 'High School Graduate',
    voter_status VARCHAR(20) DEFAULT 'Unregistered' CHECK (voter_status IN ('Registered', 'Unregistered')),
    precinct_no VARCHAR(50),
    household_id VARCHAR(50),
    is_household_head BOOLEAN DEFAULT FALSE,
    is_senior_citizen BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    pwd_type VARCHAR(100),
    is_4ps_beneficiary BOOLEAN DEFAULT FALSE,
    is_solo_parent BOOLEAN DEFAULT FALSE,
    is_indigent BOOLEAN DEFAULT FALSE,
    is_youth BOOLEAN DEFAULT FALSE,
    is_outof_school_youth BOOLEAN DEFAULT FALSE,
    national_id_no VARCHAR(50),
    philhealth_no VARCHAR(50),
    sss_no VARCHAR(50),
    photo_url TEXT,
    avatar TEXT,
    face_photo_url TEXT,
    face_verified BOOLEAN DEFAULT FALSE,
    face_confidence_score NUMERIC(5, 2),
    face_verification_timestamp TIMESTAMPTZ,
    face_verified_at TIMESTAMPTZ,
    face_liveness_score NUMERIC(5, 2),
    emergency_contact_name VARCHAR(150),
    emergency_contact_number VARCHAR(50),
    resident_status VARCHAR(30) DEFAULT 'Active' CHECK (resident_status IN ('Active', 'Deceased', 'Transferred', 'Archived')),
    remarks TEXT,
    date_registered DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_residents_name ON residents(last_name, first_name);
CREATE INDEX idx_residents_purok ON residents(purok);
CREATE INDEX idx_residents_status ON residents(resident_status);

-- 2.3 SYSTEM USERS
CREATE TABLE system_users (
    id VARCHAR(50) PRIMARY KEY,
    auth_id UUID,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'Administrator',
        'Barangay Captain',
        'Barangay Secretary',
        'Barangay Treasurer',
        'Barangay Tanod',
        'Barangay Staff',
        'Barangay Official',
        'Resident'
    )),
    position VARCHAR(150) NOT NULL,
    avatar TEXT,
    email VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    phone VARCHAR(50),
    purok VARCHAR(100),
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending Approval', 'Rejected')),
    approval_status VARCHAR(30) DEFAULT 'Approved' CHECK (approval_status IN ('Approved', 'Pending', 'Rejected')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(150),
    rejection_reason TEXT,
    valid_id_type VARCHAR(100),
    valid_id_number VARCHAR(100),
    valid_id_photo TEXT,
    valid_id_photo_url TEXT,
    proof_of_residency TEXT,
    street_address TEXT,
    birth_date DATE,
    sex VARCHAR(10) CHECK (sex IS NULL OR sex IN ('Male', 'Female')),
    civil_status VARCHAR(30) CHECK (civil_status IS NULL OR civil_status IN ('Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Common Law')),
    citizenship VARCHAR(100) DEFAULT 'Filipino',
    religion VARCHAR(100) DEFAULT 'Roman Catholic',
    blood_type VARCHAR(10) DEFAULT 'O+',
    educational_attainment VARCHAR(100),
    occupation VARCHAR(100),
    monthly_income NUMERIC(12, 2) DEFAULT 0.00,
    voter_status VARCHAR(20) DEFAULT 'Unregistered' CHECK (voter_status IS NULL OR voter_status IN ('Registered', 'Unregistered')),
    precinct_no VARCHAR(50),
    is_senior_citizen BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    pwd_type VARCHAR(100),
    is_4ps_beneficiary BOOLEAN DEFAULT FALSE,
    is_solo_parent BOOLEAN DEFAULT FALSE,
    is_indigent BOOLEAN DEFAULT FALSE,
    is_household_head BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(150),
    emergency_contact_number VARCHAR(50),
    matched_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    registration_type VARCHAR(50),
    match_confidence VARCHAR(100),
    match_reason TEXT,
    household_no VARCHAR(50),
    household_id VARCHAR(50),
    security_question VARCHAR(255),
    security_answer VARCHAR(255),
    face_photo_url TEXT,
    face_verified BOOLEAN DEFAULT FALSE,
    face_confidence_score NUMERIC(5, 2),
    face_verification_timestamp TIMESTAMPTZ,
    face_verified_at TIMESTAMPTZ,
    face_liveness_score NUMERIC(5, 2),
    password_strength_score INT DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_users_auth_id ON system_users(auth_id);

-- 2.4 HOUSEHOLDS (RBI Form 1B)
CREATE TABLE households (
    id VARCHAR(50) PRIMARY KEY,
    household_no VARCHAR(50) UNIQUE NOT NULL,
    purok VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    head_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    head_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    housing_type VARCHAR(50) DEFAULT 'Concrete' CHECK (housing_type IN ('Concrete', 'Semi-Concrete', 'Wood', 'Light Materials', 'Makeshift')),
    house_ownership VARCHAR(50) DEFAULT 'Owned' CHECK (house_ownership IN ('Owned', 'Rented', 'Informal Settler', 'Living with Relatives')),
    water_source VARCHAR(100) DEFAULT 'Piped Water / Utility' CHECK (water_source IN ('Deep Well', 'Piped Water / Utility', 'Community Faucet', 'Bottled / Refill', 'Spring / Rain')),
    sanitary_toilet BOOLEAN DEFAULT TRUE,
    electricity_source VARCHAR(100) DEFAULT 'Direct Line / Power Co.' CHECK (electricity_source IN ('Direct Line / Power Co.', 'Shared Submeter', 'Solar', 'None')),
    monthly_household_income NUMERIC(12, 2) DEFAULT 0.00,
    is_4ps_beneficiary BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    date_created DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 HOUSEHOLD MEMBERS
CREATE TABLE household_members (
    id SERIAL PRIMARY KEY,
    household_id VARCHAR(50) NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    relationship_to_head VARCHAR(50) NOT NULL CHECK (relationship_to_head IN ('Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other')),
    age INT NOT NULL,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female')),
    occupation VARCHAR(100),
    contact_number VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 BARANGAY OFFICIALS
CREATE TABLE barangay_officials (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(150) NOT NULL,
    committee VARCHAR(150),
    term_start DATE NOT NULL,
    term_end DATE NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    purok VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Term Ended')),
    photo_url TEXT,
    avatar TEXT,
    signature_url TEXT,
    display_order INT DEFAULT 99,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 CERTIFICATES & CLEARANCES
CREATE TABLE certificates (
    id VARCHAR(50) PRIMARY KEY,
    control_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    resident_address TEXT NOT NULL,
    resident_purok VARCHAR(100),
    resident_age INT,
    resident_birth_date DATE,
    resident_civil_status VARCHAR(30),
    purpose TEXT NOT NULL,
    or_number VARCHAR(50) NOT NULL,
    fee NUMERIC(10, 2) DEFAULT 0.00,
    cedula_no VARCHAR(50),
    cedula_issued_at VARCHAR(100),
    cedula_issued_date DATE,
    signatory_official VARCHAR(150) NOT NULL,
    signatory_position VARCHAR(150) NOT NULL,
    issued_by VARCHAR(150) NOT NULL,
    date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    status VARCHAR(30) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired')),
    delivery_option VARCHAR(50) DEFAULT 'Walk-in Claim',
    requested_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(150),
    rejection_reason TEXT,
    pickup_instructions TEXT,
    is_ready_for_pickup BOOLEAN DEFAULT TRUE,
    business_name VARCHAR(150),
    business_address TEXT,
    business_nature VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.8 BLOTTERS (Peace & Order Incidents)
CREATE TABLE blotters (
    id VARCHAR(50) PRIMARY KEY,
    blotter_no VARCHAR(50) UNIQUE NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    date_reported DATE NOT NULL,
    time_reported TIME NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    incident_location TEXT NOT NULL,
    purok VARCHAR(100) NOT NULL,
    complainant_name VARCHAR(150) NOT NULL,
    complainant_address TEXT NOT NULL,
    complainant_contact VARCHAR(50),
    respondent_name VARCHAR(150) NOT NULL,
    respondent_address TEXT NOT NULL,
    respondent_contact VARCHAR(50),
    witnesses TEXT,
    narrative TEXT NOT NULL,
    action_taken TEXT,
    assigned_officer VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending',
        'Active Investigation',
        'Mediation',
        'Forwarded to Lupon',
        'Settled',
        'Amicably Settled',
        'Referred to PNP',
        'Dismissed'
    )),
    resolution_date DATE,
    resolution_notes TEXT,
    recorded_by VARCHAR(150) NOT NULL,
    hearing_date DATE,
    hearing_time TIME,
    hearing_stage VARCHAR(100),
    mediator VARCHAR(150),
    settlement_terms TEXT,
    pnp_station VARCHAR(150),
    pnp_endorsement_no VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 BLOTTER ACTIVITY LOGS
CREATE TABLE blotter_activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    blotter_id VARCHAR(50) NOT NULL REFERENCES blotters(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(150) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    performed_by VARCHAR(150) NOT NULL,
    role VARCHAR(100),
    notes TEXT,
    hearing_stage VARCHAR(100),
    hearing_date DATE,
    hearing_time TIME,
    mediator VARCHAR(150),
    settlement_terms TEXT,
    pnp_station VARCHAR(150),
    endorsement_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.10 COMPLAINTS & KP PROCEEDINGS
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    case_title VARCHAR(200),
    nature_of_complaint TEXT NOT NULL,
    date_filed DATE NOT NULL,
    complainant_name VARCHAR(150) NOT NULL,
    complainant_contact VARCHAR(50),
    complainant_address TEXT,
    respondent_name VARCHAR(150) NOT NULL,
    respondent_contact VARCHAR(50),
    respondent_address TEXT,
    hearing_stage VARCHAR(100) DEFAULT '1st Mediation',
    hearing_round INT DEFAULT 1,
    hearing_date DATE,
    hearing_time TIME,
    mediator_name VARCHAR(150),
    mediator_official VARCHAR(150),
    complaint_summary TEXT,
    proceedings_notes TEXT[],
    settlement_terms TEXT,
    remarks TEXT,
    certificate_to_file_action_issued BOOLEAN DEFAULT FALSE,
    status VARCHAR(100) DEFAULT 'Open',
    date_settled DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.11 BUSINESSES
CREATE TABLE businesses (
    id VARCHAR(50) PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    owner_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    business_type VARCHAR(50) DEFAULT 'Sole Proprietorship',
    category VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    purok VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    dti_or_sec_no VARCHAR(100),
    tin_no VARCHAR(100),
    capital_investment NUMERIC(12, 2) DEFAULT 0.00,
    gross_sales NUMERIC(12, 2) DEFAULT 0.00,
    barangay_clearance_no VARCHAR(100),
    clearance_issue_date DATE,
    clearance_expiry_date DATE,
    fee_paid NUMERIC(10, 2) DEFAULT 0.00,
    or_number VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Renewal', 'Expired', 'Ceased Operation')),
    employees_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.12 ANNOUNCEMENTS
CREATE TABLE announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(100) DEFAULT 'All Residents',
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_date DATE,
    event_time VARCHAR(50),
    venue TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')),
    author VARCHAR(150) NOT NULL,
    requires_registration BOOLEAN DEFAULT FALSE,
    max_slots INT,
    attendees_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.13 ANNOUNCEMENT ATTENDEES
CREATE TABLE announcement_attendees (
    id VARCHAR(50) PRIMARY KEY,
    announcement_id VARCHAR(50) NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    purok VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'Registered',
    attended_at TIMESTAMPTZ,
    verified_by VARCHAR(150),
    remarks TEXT,
    household_no VARCHAR(50),
    voter_status VARCHAR(20),
    sector VARCHAR(50)
);

-- 2.14 COMMUNITY ACTIVITIES
CREATE TABLE community_activities (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(100),
    venue TEXT NOT NULL,
    target_purok VARCHAR(100) DEFAULT 'All Puroks',
    organizer VARCHAR(150) NOT NULL,
    attendees_count INT DEFAULT 0,
    max_attendees INT,
    max_participants INT,
    status VARCHAR(30) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Postponed')),
    is_featured BOOLEAN DEFAULT FALSE,
    requirements TEXT,
    contact_person VARCHAR(150),
    requires_registration BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.15 ACTIVITY ATTENDEES
CREATE TABLE activity_attendees (
    id VARCHAR(50) PRIMARY KEY,
    activity_id VARCHAR(50) NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    purok VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'Registered',
    attended_at TIMESTAMPTZ,
    verified_by VARCHAR(150),
    remarks TEXT,
    household_no VARCHAR(50),
    voter_status VARCHAR(20),
    sector VARCHAR(50)
);

-- 2.16 CITIZEN CONCERNS
CREATE TABLE citizen_concerns (
    id VARCHAR(50) PRIMARY KEY,
    resident_name VARCHAR(150) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    purok VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location_details TEXT,
    date_submitted TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Received' CHECK (status IN ('Received', 'In Review', 'Action Taken', 'Resolved', 'Endorsed to Lupon', 'Dismissed')),
    priority VARCHAR(30) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent', 'High', 'Emergency')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    read_by VARCHAR(150),
    assigned_to VARCHAR(150),
    action_notes TEXT,
    action_date TIMESTAMPTZ,
    action_taken_by VARCHAR(150),
    target_resolution_date DATE,
    feedback_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.17 CONCERN ACTION LOGS
CREATE TABLE concern_action_logs (
    id SERIAL PRIMARY KEY,
    concern_id VARCHAR(50) NOT NULL REFERENCES citizen_concerns(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(150) NOT NULL,
    actor VARCHAR(150) NOT NULL,
    notes TEXT,
    status_after VARCHAR(50)
);

-- 2.18 APPOINTMENTS
CREATE TABLE appointments (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    resident_name VARCHAR(150) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    assigned_official VARCHAR(150) NOT NULL,
    location VARCHAR(150) DEFAULT 'Barangay Hall Conference Room',
    status VARCHAR(30) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.19 DOCUMENTS (Ordinances & Resolutions)
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    document_no VARCHAR(100),
    series_year VARCHAR(10),
    author_or_sponsor VARCHAR(150),
    date_adopted DATE,
    date_uploaded DATE DEFAULT CURRENT_DATE,
    summary TEXT,
    description TEXT,
    file_url TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'Approved',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.20 FINANCIAL TRANSACTIONS
CREATE TABLE financial_transactions (
    id VARCHAR(50) PRIMARY KEY,
    or_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payor_name VARCHAR(150) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Online / Bank', 'Waived (Exempted)')),
    cashier_name VARCHAR(150) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.21 AUDIT LOGS
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    user_avatar TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.22 SYSTEM NOTIFICATIONS
CREATE TABLE system_notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(30) DEFAULT 'info',
    category VARCHAR(50) DEFAULT 'general',
    target_user_id VARCHAR(50),
    target_resident_id VARCHAR(50),
    target_role VARCHAR(50),
    link_module VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TRIGGERS & PROCEDURES
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_barangay_settings BEFORE UPDATE ON barangay_settings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_residents BEFORE UPDATE ON residents FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_system_users BEFORE UPDATE ON system_users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_households BEFORE UPDATE ON households FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_barangay_officials BEFORE UPDATE ON barangay_officials FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_certificates BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_blotters BEFORE UPDATE ON blotters FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_complaints BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_businesses BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_announcements BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_community_activities BEFORE UPDATE ON community_activities FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_citizen_concerns BEFORE UPDATE ON citizen_concerns FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ============================================================================
-- 4. ANALYTICAL VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_demographic_summary AS
SELECT
    COUNT(*) AS total_population,
    COUNT(*) FILTER (WHERE sex = 'Male') AS total_males,
    COUNT(*) FILTER (WHERE sex = 'Female') AS total_females,
    COUNT(*) FILTER (WHERE is_senior_citizen = TRUE OR age >= 60) AS senior_citizens,
    COUNT(*) FILTER (WHERE is_pwd = TRUE) AS persons_with_disability,
    COUNT(*) FILTER (WHERE is_4ps_beneficiary = TRUE) AS four_ps_beneficiaries,
    COUNT(*) FILTER (WHERE is_solo_parent = TRUE) AS solo_parents,
    COUNT(*) FILTER (WHERE is_indigent = TRUE) AS indigent_inhabitants,
    COUNT(*) FILTER (WHERE is_youth = TRUE OR (age >= 15 AND age <= 30)) AS youth_population,
    COUNT(*) FILTER (WHERE voter_status = 'Registered') AS registered_voters
FROM residents
WHERE resident_status = 'Active';

CREATE OR REPLACE VIEW v_purok_population AS
SELECT
    r.purok,
    COUNT(r.id) AS total_residents,
    COUNT(DISTINCT r.household_id) AS total_households,
    COUNT(r.id) FILTER (WHERE r.sex = 'Male') AS males,
    COUNT(r.id) FILTER (WHERE r.sex = 'Female') AS females,
    COUNT(r.id) FILTER (WHERE r.is_senior_citizen = TRUE) AS seniors,
    COUNT(r.id) FILTER (WHERE r.is_pwd = TRUE) AS pwds,
    COUNT(r.id) FILTER (WHERE r.voter_status = 'Registered') AS registered_voters
FROM residents r
WHERE r.resident_status = 'Active'
GROUP BY r.purok
ORDER BY total_residents DESC;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    TO_CHAR(date, 'YYYY-MM') AS month_year,
    TO_CHAR(date, 'Mon YYYY') AS formatted_month,
    service_type,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_revenue
FROM financial_transactions
GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon YYYY'), service_type
ORDER BY month_year DESC;

CREATE OR REPLACE VIEW v_lupon_settlement_rate AS
SELECT
    COUNT(*) AS total_cases,
    COUNT(*) FILTER (WHERE status IN ('Settled', 'Amicably Settled')) AS amicably_settled,
    COUNT(*) FILTER (WHERE status IN ('Mediation', 'Forwarded to Lupon', 'Active Investigation')) AS ongoing_mediation,
    COUNT(*) FILTER (WHERE status = 'Referred to PNP') AS referred_to_pnp,
    COUNT(*) FILTER (WHERE status = 'Dismissed') AS dismissed,
    ROUND((COUNT(*) FILTER (WHERE status IN ('Settled', 'Amicably Settled'))::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS settlement_percentage
FROM blotters;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Security Model:
--   1. Admin & Staff: Full access (SELECT, INSERT, UPDATE, DELETE) to all records.
--   2. Residents: Can only access their own records (via resident_id or user_id).
--   3. Unauthenticated / Anon: Can only submit sign-up requests & read public data.
-- ============================================================================

-- Helper Functions (SECURITY DEFINER to prevent recursive RLS evaluations)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_users
    WHERE (
      auth_id = auth.uid() 
      OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
    )
    AND role IN (
      'Administrator',
      'Barangay Captain',
      'Barangay Secretary',
      'Barangay Treasurer',
      'Barangay Tanod',
      'Barangay Staff',
      'Barangay Official'
    )
    AND status = 'Active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_resident_id()
RETURNS varchar
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT resident_id FROM public.system_users
  WHERE (
    auth_id = auth.uid() 
    OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS varchar
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.system_users
  WHERE (
    auth_id = auth.uid() 
    OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  )
  LIMIT 1;
$$;

-- Enable RLS on core tables
ALTER TABLE IF EXISTS system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS households ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barangay_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barangay_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS citizen_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS concern_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blotters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blotter_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcement_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barangay_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_notifications ENABLE ROW LEVEL SECURITY;

-- system_users Policies
DROP POLICY IF EXISTS admin_staff_all_system_users ON system_users;
CREATE POLICY admin_staff_all_system_users ON system_users
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_system_user ON system_users;
CREATE POLICY resident_select_own_system_user ON system_users
  FOR SELECT TO authenticated
  USING (
    auth_id = auth.uid() 
    OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
    OR (resident_id IS NOT NULL AND resident_id = public.get_current_resident_id())
  );

DROP POLICY IF EXISTS resident_update_own_system_user ON system_users;
CREATE POLICY resident_update_own_system_user ON system_users
  FOR UPDATE TO authenticated
  USING (
    auth_id = auth.uid() 
    OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  )
  WITH CHECK (
    auth_id = auth.uid() 
    OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS anon_insert_resident_signup ON system_users;
CREATE POLICY anon_insert_resident_signup ON system_users
  FOR INSERT TO anon, authenticated
  WITH CHECK (role = 'Resident' AND status = 'Pending Approval');

-- residents Policies
DROP POLICY IF EXISTS admin_staff_all_residents ON residents;
CREATE POLICY admin_staff_all_residents ON residents
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_record ON residents;
CREATE POLICY resident_select_own_record ON residents
  FOR SELECT TO authenticated
  USING (id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_update_own_record ON residents;
CREATE POLICY resident_update_own_record ON residents
  FOR UPDATE TO authenticated
  USING (id = public.get_current_resident_id())
  WITH CHECK (id = public.get_current_resident_id());

-- households Policies
DROP POLICY IF EXISTS admin_staff_all_households ON households;
CREATE POLICY admin_staff_all_households ON households
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_household ON households;
CREATE POLICY resident_select_own_household ON households
  FOR SELECT TO authenticated
  USING (id = (SELECT household_id FROM public.residents WHERE id = public.get_current_resident_id()));

-- household_members Policies
DROP POLICY IF EXISTS admin_staff_all_household_members ON household_members;
CREATE POLICY admin_staff_all_household_members ON household_members
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_household_members ON household_members;
CREATE POLICY resident_select_own_household_members ON household_members
  FOR SELECT TO authenticated
  USING (
    resident_id = public.get_current_resident_id()
    OR household_id = (SELECT household_id FROM public.residents WHERE id = public.get_current_resident_id())
  );

-- barangay_settings & officials Policies
DROP POLICY IF EXISTS public_select_barangay_settings ON barangay_settings;
CREATE POLICY public_select_barangay_settings ON barangay_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS admin_staff_manage_barangay_settings ON barangay_settings;
CREATE POLICY admin_staff_manage_barangay_settings ON barangay_settings
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS public_select_barangay_officials ON barangay_officials;
CREATE POLICY public_select_barangay_officials ON barangay_officials FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS admin_staff_manage_barangay_officials ON barangay_officials;
CREATE POLICY admin_staff_manage_barangay_officials ON barangay_officials
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

-- certificates Policies
DROP POLICY IF EXISTS admin_staff_all_certificates ON certificates;
CREATE POLICY admin_staff_all_certificates ON certificates
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_certificates ON certificates;
CREATE POLICY resident_select_own_certificates ON certificates
  FOR SELECT TO authenticated USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_certificates ON certificates;
CREATE POLICY resident_insert_own_certificates ON certificates
  FOR INSERT TO authenticated WITH CHECK (resident_id = public.get_current_resident_id());

-- appointments Policies
DROP POLICY IF EXISTS admin_staff_all_appointments ON appointments;
CREATE POLICY admin_staff_all_appointments ON appointments
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_appointments ON appointments;
CREATE POLICY resident_select_own_appointments ON appointments
  FOR SELECT TO authenticated USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_appointments ON appointments;
CREATE POLICY resident_insert_own_appointments ON appointments
  FOR INSERT TO authenticated WITH CHECK (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_update_own_appointments ON appointments;
CREATE POLICY resident_update_own_appointments ON appointments
  FOR UPDATE TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- citizen_concerns & action logs Policies
DROP POLICY IF EXISTS admin_staff_all_citizen_concerns ON citizen_concerns;
CREATE POLICY admin_staff_all_citizen_concerns ON citizen_concerns
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_citizen_concerns ON citizen_concerns;
CREATE POLICY resident_select_own_citizen_concerns ON citizen_concerns
  FOR SELECT TO authenticated USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_citizen_concerns ON citizen_concerns;
CREATE POLICY resident_insert_own_citizen_concerns ON citizen_concerns
  FOR INSERT TO authenticated WITH CHECK (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS admin_staff_all_concern_action_logs ON concern_action_logs;
CREATE POLICY admin_staff_all_concern_action_logs ON concern_action_logs
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_concern_action_logs ON concern_action_logs;
CREATE POLICY resident_select_own_concern_action_logs ON concern_action_logs
  FOR SELECT TO authenticated
  USING (concern_id IN (SELECT id FROM public.citizen_concerns WHERE resident_id = public.get_current_resident_id()));

-- blotters Policies
DROP POLICY IF EXISTS admin_staff_all_blotters ON blotters;
CREATE POLICY admin_staff_all_blotters ON blotters
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_blotters ON blotters;
CREATE POLICY resident_select_own_blotters ON blotters
  FOR SELECT TO authenticated
  USING (
    complainant_resident_id = public.get_current_resident_id() 
    OR respondent_resident_id = public.get_current_resident_id()
  );

DROP POLICY IF EXISTS admin_staff_all_blotter_activity_logs ON blotter_activity_logs;
CREATE POLICY admin_staff_all_blotter_activity_logs ON blotter_activity_logs
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_blotter_activity_logs ON blotter_activity_logs;
CREATE POLICY resident_select_own_blotter_activity_logs ON blotter_activity_logs
  FOR SELECT TO authenticated
  USING (
    blotter_id IN (
      SELECT id FROM public.blotters 
      WHERE complainant_resident_id = public.get_current_resident_id() 
         OR respondent_resident_id = public.get_current_resident_id()
    )
  );

-- complaints Policies
DROP POLICY IF EXISTS admin_staff_all_complaints ON complaints;
CREATE POLICY admin_staff_all_complaints ON complaints
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_complaints ON complaints;
CREATE POLICY resident_select_own_complaints ON complaints
  FOR SELECT TO authenticated
  USING (complainant_id = public.get_current_resident_id() OR respondent_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_complaints ON complaints;
CREATE POLICY resident_insert_own_complaints ON complaints
  FOR INSERT TO authenticated WITH CHECK (complainant_id = public.get_current_resident_id());

-- businesses Policies
DROP POLICY IF EXISTS admin_staff_all_businesses ON businesses;
CREATE POLICY admin_staff_all_businesses ON businesses
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_businesses ON businesses;
CREATE POLICY resident_select_own_businesses ON businesses
  FOR SELECT TO authenticated USING (owner_resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_businesses ON businesses;
CREATE POLICY resident_insert_own_businesses ON businesses
  FOR INSERT TO authenticated WITH CHECK (owner_resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_update_own_businesses ON businesses;
CREATE POLICY resident_update_own_businesses ON businesses
  FOR UPDATE TO authenticated
  USING (owner_resident_id = public.get_current_resident_id())
  WITH CHECK (owner_resident_id = public.get_current_resident_id());

-- announcements Policies
DROP POLICY IF EXISTS public_select_announcements ON announcements;
CREATE POLICY public_select_announcements ON announcements FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS admin_staff_manage_announcements ON announcements;
CREATE POLICY admin_staff_manage_announcements ON announcements
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_all_announcement_attendees ON announcement_attendees;
CREATE POLICY admin_staff_all_announcement_attendees ON announcement_attendees
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_announcement_attendees ON announcement_attendees;
CREATE POLICY resident_manage_own_announcement_attendees ON announcement_attendees
  FOR ALL TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- community_activities Policies
DROP POLICY IF EXISTS public_select_community_activities ON community_activities;
CREATE POLICY public_select_community_activities ON community_activities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS admin_staff_manage_community_activities ON community_activities;
CREATE POLICY admin_staff_manage_community_activities ON community_activities
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_all_activity_attendees ON activity_attendees;
CREATE POLICY admin_staff_all_activity_attendees ON activity_attendees
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_activity_attendees ON activity_attendees;
CREATE POLICY resident_manage_own_activity_attendees ON activity_attendees
  FOR ALL TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- documents & files Policies
DROP POLICY IF EXISTS public_select_documents ON documents;
CREATE POLICY public_select_documents ON documents
  FOR SELECT TO public USING (is_public = TRUE OR status = 'Approved' OR public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_manage_documents ON documents;
CREATE POLICY admin_staff_manage_documents ON documents
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

-- financial_transactions Policies
DROP POLICY IF EXISTS admin_staff_all_financial_transactions ON financial_transactions;
CREATE POLICY admin_staff_all_financial_transactions ON financial_transactions
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_financial_transactions ON financial_transactions;
CREATE POLICY resident_select_own_financial_transactions ON financial_transactions
  FOR SELECT TO authenticated
  USING (certificate_id IN (SELECT id FROM public.certificates WHERE resident_id = public.get_current_resident_id()));

-- audit_logs Policies
DROP POLICY IF EXISTS admin_staff_all_audit_logs ON audit_logs;
CREATE POLICY admin_staff_all_audit_logs ON audit_logs
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS authenticated_insert_audit_logs ON audit_logs;
CREATE POLICY authenticated_insert_audit_logs ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- system_notifications Policies
DROP POLICY IF EXISTS admin_staff_all_system_notifications ON system_notifications;
CREATE POLICY admin_staff_all_system_notifications ON system_notifications
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_notifications ON system_notifications;
CREATE POLICY resident_manage_own_notifications ON system_notifications
  FOR ALL TO authenticated
  USING (recipient_id = public.get_current_resident_id() OR user_id = public.get_current_user_id())
  WITH CHECK (recipient_id = public.get_current_resident_id() OR user_id = public.get_current_user_id());

