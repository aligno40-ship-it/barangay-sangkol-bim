-- ============================================================================
-- BARANGAY SANGKOL MANAGEMENT SYSTEM - POSTGRESQL DATABASE SCHEMA (DDL)
-- Location: Barangay Sangkol, City of Dipolog, Zamboanga del Norte, Philippines
-- Target Engine: PostgreSQL 14 / 15 / 16 / 17
-- ============================================================================

-- 1. EXTENSIONS & GENERAL SETUP
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
DROP TABLE IF EXISTS community_services CASCADE;
DROP TABLE IF EXISTS assistive_device_requests CASCADE;
DROP TABLE IF EXISTS senior_citizen_benefit_schedules CASCADE;
DROP TABLE IF EXISTS sk_registration_records CASCADE;
DROP TABLE IF EXISTS sk_tournament_activities CASCADE;
DROP TABLE IF EXISTS mrf_recyclables_drop_records CASCADE;
DROP TABLE IF EXISTS illegal_dumping_reports CASCADE;
DROP TABLE IF EXISTS bayanihan_volunteer_records CASCADE;
DROP TABLE IF EXISTS bayanihan_clean_up_drives CASCADE;
DROP TABLE IF EXISTS bulk_waste_pickup_requests CASCADE;
DROP TABLE IF EXISTS waste_collection_schedules CASCADE;
DROP TABLE IF EXISTS financial_assistance_requests CASCADE;
DROP TABLE IF EXISTS ayuda_claim_stubs CASCADE;
DROP TABLE IF EXISTS livelihood_assistance_requests CASCADE;
DROP TABLE IF EXISTS livelihood_enrollment_records CASCADE;
DROP TABLE IF EXISTS livelihood_training_workshops CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS health_outreach_missions CASCADE;
DROP TABLE IF EXISTS medicine_refill_requests CASCADE;
DROP TABLE IF EXISTS pharmacy_inventory CASCADE;
DROP TABLE IF EXISTS child_immunizations CASCADE;
DROP TABLE IF EXISTS health_appointments CASCADE;
DROP TABLE IF EXISTS equipment_reservations CASCADE;
DROP TABLE IF EXISTS facility_reservations CASCADE;
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

-- 2. BARANGAY SETTINGS TABLE
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

-- 3. RESIDENTS TABLE (Registry of Barangay Inhabitants - RBI Form 1A)
CREATE TABLE residents (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'BS-RES-2026-0001'
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    alias VARCHAR(100),
    birth_date DATE NOT NULL,
    age INT,
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
    household_id VARCHAR(50), -- Reference to household table
    is_household_head BOOLEAN DEFAULT FALSE,
    -- Sectoral & Welfare tags
    is_senior_citizen BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    pwd_type VARCHAR(100),
    is_4ps_beneficiary BOOLEAN DEFAULT FALSE,
    is_solo_parent BOOLEAN DEFAULT FALSE,
    is_indigent BOOLEAN DEFAULT FALSE,
    is_youth BOOLEAN DEFAULT FALSE,
    is_outof_school_youth BOOLEAN DEFAULT FALSE,
    -- Official Identifications & Metadata
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
    face_biometric_quality JSONB DEFAULT '{}'::jsonb,
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
CREATE INDEX idx_residents_sectoral ON residents(is_senior_citizen, is_pwd, is_4ps_beneficiary, is_indigent);

-- 4. SYSTEM USERS TABLE (Accounts & Role-Based Access Control)
CREATE TABLE system_users (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'USR-001'
    auth_id UUID, -- References Supabase auth.users(id)
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Stored password or bcrypt hash
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
    face_biometric_quality JSONB DEFAULT '{}'::jsonb,
    password_strength_score INT DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON system_users(role);
CREATE INDEX idx_users_status ON system_users(status);
CREATE INDEX idx_system_users_auth_id ON system_users(auth_id);

-- 5. HOUSEHOLDS TABLE (RBI Form 1B - Household Registry)
CREATE TABLE households (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'HH-SNG-001'
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

CREATE INDEX idx_households_purok ON households(purok);

-- 6. HOUSEHOLD MEMBERS TABLE
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

CREATE INDEX idx_household_members_hh ON household_members(household_id);

-- 7. BARANGAY OFFICIALS & STAFF TABLE
CREATE TABLE barangay_officials (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'OFF-001'
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

CREATE INDEX idx_officials_order ON barangay_officials(display_order);

-- 8. CERTIFICATES & CLEARANCES TABLE
CREATE TABLE certificates (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'CERT-2026-0101'
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

CREATE INDEX idx_certificates_control ON certificates(control_number);
CREATE INDEX idx_certificates_resident ON certificates(resident_id);
CREATE INDEX idx_certificates_date ON certificates(date_issued);

-- 9. BLOTTERS TABLE (Peace & Order Incident Records)
CREATE TABLE blotters (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'BLT-2026-0041'
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

CREATE INDEX idx_blotters_purok ON blotters(purok);
CREATE INDEX idx_blotters_status ON blotters(status);
CREATE INDEX idx_blotters_date ON blotters(incident_date);

-- 10. BLOTTER ACTIVITY LOGS TABLE
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

CREATE INDEX idx_blotter_logs_blotter ON blotter_activity_logs(blotter_id);

-- 11. COMPLAINTS & KP PROCEEDINGS TABLE (Katarungang Pambarangay Cases)
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'KP-2026-0018'
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

CREATE INDEX idx_complaints_case ON complaints(case_number);
CREATE INDEX idx_complaints_status ON complaints(status);

-- 12. BUSINESS RECORDS TABLE (Commercial Registry & Permits)
CREATE TABLE businesses (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'BUS-2026-001'
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

CREATE INDEX idx_businesses_purok ON businesses(purok);
CREATE INDEX idx_businesses_status ON businesses(status);

-- 13. ANNOUNCEMENTS TABLE
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

-- 14. ANNOUNCEMENT ATTENDEES TABLE
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

-- 15. COMMUNITY ACTIVITIES TABLE
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

-- 16. ACTIVITY ATTENDEES TABLE
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

-- 17. COMMUNITY SERVICES & FRONTLINE DESK TABLE
CREATE TABLE community_services (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(150),
    purok VARCHAR(100),
    service_category VARCHAR(80) NOT NULL CHECK (service_category IN (
        'Facilities',
        'Health',
        'Employment',
        'Livelihood',
        'Financial Aid',
        'Waste Management',
        'Youth & Senior',
        'General Service'
    )),
    service_type VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    request_location TEXT,
    scheduled_date DATE,
    scheduled_time VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent', 'High', 'Emergency')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review' CHECK (status IN (
        'Pending Review',
        'Approved',
        'Rejected',
        'In Progress',
        'Completed',
        'Cancelled',
        'Released',
        'Claimed',
        'Disbursed',
        'Confirmed',
        'Under Review'
    )),
    assigned_officer VARCHAR(150),
    reference_no VARCHAR(100),
    amount NUMERIC(12, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_community_services_resident ON community_services(resident_id);
CREATE INDEX idx_community_services_category ON community_services(service_category);
CREATE INDEX idx_community_services_status ON community_services(status);
CREATE INDEX idx_community_services_date ON community_services(scheduled_date);

-- 18. CITIZEN CONCERNS & INCIDENT TICKETS TABLE
-- 18. FACILITY RESERVATIONS TABLE
CREATE TABLE facility_reservations (
    id VARCHAR(50) PRIMARY KEY,
    facility_name VARCHAR(100) NOT NULL,
    reserved_by_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    event_title VARCHAR(200) NOT NULL,
    purpose TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    expected_attendees INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected', 'Completed', 'Cancelled')),
    fee NUMERIC(10, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_reservations_status ON facility_reservations(status);
CREATE INDEX idx_facility_reservations_date ON facility_reservations(reservation_date);

-- 19. EQUIPMENT RESERVATIONS TABLE
CREATE TABLE equipment_reservations (
    id VARCHAR(50) PRIMARY KEY,
    equipment_name VARCHAR(150) NOT NULL,
    quantity INT DEFAULT 1,
    reserved_by_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    borrow_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Released / In Use', 'Returned', 'Rejected')),
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    condition_on_release TEXT,
    condition_on_return TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_reservations_status ON equipment_reservations(status);

-- 20. HEALTH APPOINTMENTS TABLE
CREATE TABLE health_appointments (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_age INT,
    service_type VARCHAR(120) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_slot VARCHAR(50),
    attending_health_worker VARCHAR(150),
    symptoms_or_purpose TEXT,
    status VARCHAR(40) DEFAULT 'Pending Triage' CHECK (status IN ('Pending Triage', 'Triage Recorded', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled')),
    vitals JSONB DEFAULT '{}'::jsonb,
    diagnosis TEXT,
    prescriptions_or_advice TEXT,
    queue_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_appointments_status ON health_appointments(status);
CREATE INDEX idx_health_appointments_date ON health_appointments(preferred_date);

-- 21. CHILD IMMUNIZATION TRACKER TABLE
CREATE TABLE child_immunizations (
    id VARCHAR(50) PRIMARY KEY,
    child_name VARCHAR(150) NOT NULL,
    birth_date DATE,
    parent_resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    parent_name VARCHAR(150),
    vaccine_name VARCHAR(120) NOT NULL,
    dose_number VARCHAR(40) NOT NULL,
    due_date DATE,
    administered_date DATE,
    administered_by VARCHAR(150),
    batch_or_lot_number VARCHAR(100),
    injection_site VARCHAR(120),
    status VARCHAR(30) DEFAULT 'Due Soon' CHECK (status IN ('Due Soon', 'Completed', 'Overdue')),
    adverse_effects_or_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_child_immunizations_status ON child_immunizations(status);

-- 22. PHARMACY INVENTORY TABLE
CREATE TABLE pharmacy_inventory (
    id VARCHAR(50) PRIMARY KEY,
    generic_name VARCHAR(150) NOT NULL,
    brand_or_dosage VARCHAR(150),
    dosage_form VARCHAR(80),
    strength VARCHAR(80),
    category VARCHAR(80) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(80),
    reorder_level INT DEFAULT 0,
    minimum_threshold INT DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    requires_prescription BOOLEAN DEFAULT FALSE,
    dosing_instructions TEXT,
    indications TEXT,
    donor_or_supplier VARCHAR(150),
    program_source VARCHAR(150),
    status VARCHAR(40) DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Critical Stock', 'Out of Stock', 'Expired / Quarantine')),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_restocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pharmacy_inventory_status ON pharmacy_inventory(status);

-- 23. MEDICINE REFILL REQUESTS TABLE
CREATE TABLE medicine_refill_requests (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    medicine_name VARCHAR(150) NOT NULL,
    inventory_item_id VARCHAR(50),
    quantity_requested INT DEFAULT 1,
    prescription_attached BOOLEAN DEFAULT FALSE,
    prescription_image_url TEXT,
    doctor_prescriber_name VARCHAR(150),
    doctor_license_no VARCHAR(80),
    purpose TEXT,
    status VARCHAR(40) DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Pending Dispensing', 'Ready for Pickup', 'Dispensed', 'Out of Stock', 'Rejected')),
    pharmacist_notes TEXT,
    dispensed_by VARCHAR(150),
    dispensed_at TIMESTAMPTZ,
    batch_dispensed VARCHAR(100),
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medicine_refill_requests_status ON medicine_refill_requests(status);

-- 24. HEALTH OUTREACH MISSIONS TABLE
CREATE TABLE health_outreach_missions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    mission_type VARCHAR(120),
    program_type VARCHAR(120),
    target_beneficiaries TEXT,
    target_purok VARCHAR(100),
    mission_date DATE NOT NULL,
    time_schedule VARCHAR(100),
    venue TEXT NOT NULL,
    lead_provider VARCHAR(150),
    max_slots INT DEFAULT 0,
    registered_count INT DEFAULT 0,
    registered_beneficiary_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
    banner_color VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_outreach_missions_date ON health_outreach_missions(mission_date);

-- 25. JOB POSTINGS TABLE
CREATE TABLE job_postings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    employer_name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    employment_type VARCHAR(40) NOT NULL,
    salary_range VARCHAR(80),
    vacancies INT DEFAULT 1,
    description TEXT NOT NULL,
    qualifications TEXT[] DEFAULT ARRAY[]::TEXT[],
    contact_person VARCHAR(150),
    contact_number VARCHAR(50),
    posted_date DATE DEFAULT CURRENT_DATE,
    deadline_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 26. JOB APPLICATIONS TABLE
CREATE TABLE job_applications (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES job_postings(id) ON DELETE CASCADE,
    job_title VARCHAR(200) NOT NULL,
    employer_name VARCHAR(150),
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    educational_attainment VARCHAR(120),
    work_experience TEXT,
    resume_file_name VARCHAR(200),
    resume_file_data TEXT,
    application_letter_file_name VARCHAR(200),
    application_letter_file_data TEXT,
    application_letter_text TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Invited for Interview', 'Hired')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_applications_status ON job_applications(status);

-- 27. LIVELIHOOD TRAINING WORKSHOPS TABLE
CREATE TABLE livelihood_training_workshops (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    partner_agency VARCHAR(120) NOT NULL,
    slots_available INT DEFAULT 0,
    slots_total INT DEFAULT 0,
    schedule VARCHAR(150),
    duration VARCHAR(80),
    venue VARCHAR(200),
    starter_kit_provided BOOLEAN DEFAULT FALSE,
    trainer_name VARCHAR(150),
    description TEXT NOT NULL,
    qualifications TEXT,
    start_date DATE,
    status VARCHAR(40) DEFAULT 'Open for Registration' CHECK (status IN ('Open for Registration', 'Ongoing', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 28. LIVELIHOOD ENROLLMENT RECORDS TABLE
CREATE TABLE livelihood_enrollment_records (
    id VARCHAR(50) PRIMARY KEY,
    training_id VARCHAR(50) REFERENCES livelihood_training_workshops(id) ON DELETE CASCADE,
    training_title VARCHAR(200),
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    educational_background VARCHAR(120),
    current_occupation VARCHAR(120),
    intent_reason TEXT,
    resume_file_name VARCHAR(200),
    resume_file_data TEXT,
    application_letter_file_name VARCHAR(200),
    application_letter_file_data TEXT,
    application_letter_text TEXT,
    enrolled_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(40) DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Waitlisted', 'Graduated with Certificate', 'Under Review', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 29. LIVELIHOOD ASSISTANCE REQUESTS TABLE
CREATE TABLE livelihood_assistance_requests (
    id VARCHAR(50) PRIMARY KEY,
    program_type VARCHAR(120) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    proposed_business VARCHAR(200) NOT NULL,
    estimated_budget NUMERIC(12, 2) DEFAULT 0.00,
    requested_grant_amount NUMERIC(12, 2) DEFAULT 0.00,
    approved_amount NUMERIC(12, 2) DEFAULT 0.00,
    target_start_date DATE,
    statement_of_need TEXT,
    business_plan_file_name VARCHAR(200),
    business_plan_file_data TEXT,
    endorsement_letter_file_name VARCHAR(200),
    endorsement_letter_file_data TEXT,
    status VARCHAR(40) DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Field Validation', 'Approved - For Release', 'Disbursed / Released', 'Rejected')),
    reviewer_notes TEXT,
    resolution_reference_no VARCHAR(100),
    date_requested DATE DEFAULT CURRENT_DATE,
    date_disbursed DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 30. AYUDA CLAIM STUBS TABLE
CREATE TABLE ayuda_claim_stubs (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(120) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    purok VARCHAR(100),
    household_no VARCHAR(50),
    claim_location VARCHAR(200),
    distribution_date DATE,
    time_slot VARCHAR(50),
    qr_payload TEXT,
    items_included TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) DEFAULT 'Available to Claim' CHECK (status IN ('Available to Claim', 'Claimed / Released', 'Expired')),
    claimed_at TIMESTAMPTZ,
    released_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 31. FINANCIAL ASSISTANCE REQUESTS TABLE
CREATE TABLE financial_assistance_requests (
    id VARCHAR(50) PRIMARY KEY,
    assistance_type VARCHAR(150) NOT NULL,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    amount_requested NUMERIC(12, 2) DEFAULT 0.00,
    beneficiary_name VARCHAR(150),
    justification TEXT,
    documents_submitted TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(40) DEFAULT 'Application Submitted' CHECK (status IN ('Application Submitted', 'Social Worker Assessment', 'Approved for Payout', 'Disbursed', 'Disapproved')),
    disbursed_amount NUMERIC(12, 2) DEFAULT 0.00,
    disbursed_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 32. WASTE COLLECTION SCHEDULES TABLE
CREATE TABLE waste_collection_schedules (
    id VARCHAR(50) PRIMARY KEY,
    purok_name VARCHAR(100) NOT NULL,
    waste_type VARCHAR(120) NOT NULL,
    collection_days VARCHAR(120),
    pickup_time VARCHAR(80),
    assigned_truck_no VARCHAR(80),
    eco_officer_in_charge VARCHAR(150),
    status VARCHAR(40) DEFAULT 'On Schedule' CHECK (status IN ('On Schedule', 'En Route to Purok', 'Collecting Now', 'Delayed due to Weather', 'Completed Today')),
    route_notes TEXT,
    driver_name VARCHAR(150),
    driver_contact VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 33. BULK WASTE PICKUP REQUESTS TABLE
CREATE TABLE bulk_waste_pickup_requests (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    street_address TEXT,
    waste_description TEXT,
    waste_category VARCHAR(120) NOT NULL,
    estimated_volume VARCHAR(80),
    photo_url TEXT,
    preferred_pickup_date DATE,
    status VARCHAR(30) DEFAULT 'Pending Schedule' CHECK (status IN ('Pending Schedule', 'Pickup Scheduled', 'Collected', 'Cancelled')),
    assigned_crew VARCHAR(150),
    pickup_time_window VARCHAR(80),
    admin_remarks TEXT,
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 34. BECOME BAYANIHAN CLEAN-UP DRIVES TABLE
CREATE TABLE bayanihan_clean_up_drives (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    purok_target VARCHAR(100),
    activity_date DATE,
    assembly_time VARCHAR(80),
    assembly_point TEXT,
    expected_volunteers INT DEFAULT 0,
    current_volunteers INT DEFAULT 0,
    coordinator VARCHAR(150),
    description TEXT,
    equipment_provided TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In Progress', 'Completed', 'Postponed')),
    target_linear_meters VARCHAR(80),
    waste_collected_sacks INT DEFAULT 0,
    incentive_package TEXT,
    before_after_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 35. BAYANIHAN VOLUNTEER RECORDS TABLE
CREATE TABLE bayanihan_volunteer_records (
    id VARCHAR(50) PRIMARY KEY,
    drive_id VARCHAR(50) REFERENCES bayanihan_clean_up_drives(id) ON DELETE CASCADE,
    drive_title VARCHAR(200),
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    registered_date DATE DEFAULT CURRENT_DATE,
    volunteer_role VARCHAR(80),
    hours_rendered NUMERIC(5, 2) DEFAULT 0.00,
    attendance_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(150),
    certificate_code VARCHAR(120),
    certificate_issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 36. ILLEGAL DUMPING REPORTS TABLE
CREATE TABLE illegal_dumping_reports (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    purok VARCHAR(100),
    exact_location_or_landmark TEXT,
    violation_type VARCHAR(150) NOT NULL,
    description TEXT,
    photo_url TEXT,
    severity_level VARCHAR(80) NOT NULL,
    status VARCHAR(40) DEFAULT 'Report Received' CHECK (status IN ('Report Received', 'Tanod Dispatched', 'Cleaned & Cleared', 'Notice Issued / Resolved')),
    assigned_tanod_or_crew VARCHAR(150),
    resolution_remarks TEXT,
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 37. MRF RECYCLABLES DROP RECORDS TABLE
CREATE TABLE mrf_recyclables_drop_records (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    purok VARCHAR(100),
    item_category VARCHAR(120) NOT NULL,
    weight_kg NUMERIC(8, 2) DEFAULT 0.00,
    reward_type VARCHAR(80) NOT NULL,
    reward_value VARCHAR(80),
    officer_in_charge VARCHAR(150),
    logged_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 38. SK TOURNAMENT ACTIVITIES TABLE
CREATE TABLE sk_tournament_activities (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(150) NOT NULL,
    target_age_group VARCHAR(120),
    schedule_dates VARCHAR(150),
    venue TEXT,
    prizes TEXT,
    registration_status VARCHAR(40) DEFAULT 'Registration Open' CHECK (registration_status IN ('Registration Open', 'Brackets Released', 'Ongoing Games', 'Concluded')),
    sk_contact_person VARCHAR(150),
    contact_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 39. SK REGISTRATION RECORDS TABLE
CREATE TABLE sk_registration_records (
    id VARCHAR(50) PRIMARY KEY,
    activity_id VARCHAR(50) REFERENCES sk_tournament_activities(id) ON DELETE CASCADE,
    activity_title VARCHAR(200),
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    age INT,
    purok VARCHAR(100),
    team_or_category VARCHAR(150),
    registered_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Registered & Confirmed' CHECK (status IN ('Registered & Confirmed', 'Waitlisted')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 40. SENIOR CITIZEN BENEFIT SCHEDULES TABLE
CREATE TABLE senior_citizen_benefit_schedules (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(150) NOT NULL,
    purok_coverage VARCHAR(200),
    distribution_date DATE,
    venue TEXT,
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) DEFAULT 'Upcoming Release' CHECK (status IN ('Upcoming Release', 'Claiming in Progress', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 41. ASSISTIVE DEVICE REQUESTS TABLE
CREATE TABLE assistive_device_requests (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    beneficiary_name VARCHAR(150),
    beneficiary_age INT,
    purok VARCHAR(100),
    device_requested VARCHAR(120) NOT NULL,
    medical_condition_reason TEXT,
    priority_level VARCHAR(30) DEFAULT 'Standard' CHECK (priority_level IN ('High / Urgent', 'Standard')),
    status VARCHAR(30) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'BHW Home Assessment', 'Approved for Delivery', 'Delivered to Residence')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_concerns_status ON citizen_concerns(status);
CREATE INDEX idx_concerns_priority ON citizen_concerns(priority);

-- 18. CONCERN ACTION LOGS TABLE
CREATE TABLE concern_action_logs (
    id SERIAL PRIMARY KEY,
    concern_id VARCHAR(50) NOT NULL REFERENCES citizen_concerns(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(150) NOT NULL,
    actor VARCHAR(150) NOT NULL,
    notes TEXT,
    status_after VARCHAR(50)
);

-- 19. APPOINTMENT RECORDS TABLE
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

-- 20. DOCUMENTS & LEGISLATIVE ORDINANCES TABLE
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

-- 21. FINANCIAL TRANSACTIONS TABLE (Official Receipts)
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

CREATE INDEX idx_transactions_date ON financial_transactions(date);
CREATE INDEX idx_transactions_or ON financial_transactions(or_number);

-- 22. AUDIT LOGS TABLE
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

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_module ON audit_logs(module);

-- 23. SYSTEM NOTIFICATIONS TABLE
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
    certificate_id VARCHAR(50),
    control_number VARCHAR(50),
    transaction_id VARCHAR(50),
    or_number VARCHAR(50),
    amount NUMERIC(12, 2) DEFAULT 0.00,
    payor_name VARCHAR(150),
    service_type VARCHAR(100),
    payment_method VARCHAR(50),
    cashier_name VARCHAR(150),
    target_record_id VARCHAR(50),
    action_text TEXT,
    is_transaction_notification BOOLEAN DEFAULT FALSE,
    resident_name VARCHAR(150),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 24. BARANGAY FILE STORAGE TABLE
CREATE TABLE barangay_files (
    id VARCHAR(50) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_title VARCHAR(255) NOT NULL,
    file_category VARCHAR(80) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(120),
    file_size BIGINT DEFAULT 0,
    file_size_formatted VARCHAR(50),
    storage_path TEXT NOT NULL,
    uploader_id VARCHAR(50) NOT NULL,
    uploader_name VARCHAR(150) NOT NULL,
    uploader_role VARCHAR(50) NOT NULL,
    date_uploaded TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMPTZ,
    access_level VARCHAR(80) DEFAULT 'Public (All Citizens)',
    status VARCHAR(80) DEFAULT 'Active / Verified',
    version VARCHAR(30) DEFAULT 'v1.0',
    file_hash VARCHAR(255),
    linked_entity_id VARCHAR(50),
    linked_entity_type VARCHAR(50),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    download_count INT DEFAULT 0,
    is_confidential BOOLEAN DEFAULT FALSE,
    retention_expiry DATE,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_barangay_files_category ON barangay_files(file_category);
CREATE INDEX idx_barangay_files_status ON barangay_files(status);

-- 25. SMS ALERT DISPATCH LOGS TABLE
CREATE TABLE sms_alerts (
    id VARCHAR(50) PRIMARY KEY,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(150),
    recipient_resident_id VARCHAR(50),
    purok VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    sms_message TEXT NOT NULL,
    email_body TEXT,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'Email', 'Both')),
    sender VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Delivered', 'Sent', 'Failed', 'Pending')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    related_record_id VARCHAR(50),
    related_record_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_alerts_status ON sms_alerts(status);
CREATE INDEX idx_sms_alerts_timestamp ON sms_alerts(timestamp DESC);

-- 26. NOTIFICATION DELIVERY LOGS TABLE
CREATE TABLE notification_logs (
    id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50),
    resident_name VARCHAR(150),
    certificate_id VARCHAR(50),
    control_number VARCHAR(50),
    certificate_type VARCHAR(100),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'email')),
    recipient_target VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message_content TEXT NOT NULL,
    provider VARCHAR(100) NOT NULL,
    provider_message_id VARCHAR(200),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_by VARCHAR(150),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_timestamp ON notification_logs(timestamp DESC);

-- ============================================================================
-- 27. TRIGGERS & AUTOMATION FUNCTIONS
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
CREATE TRIGGER set_timestamp_community_services BEFORE UPDATE ON community_services FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_facility_reservations BEFORE UPDATE ON facility_reservations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_equipment_reservations BEFORE UPDATE ON equipment_reservations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_health_appointments BEFORE UPDATE ON health_appointments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_child_immunizations BEFORE UPDATE ON child_immunizations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pharmacy_inventory BEFORE UPDATE ON pharmacy_inventory FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_medicine_refill_requests BEFORE UPDATE ON medicine_refill_requests FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_health_outreach_missions BEFORE UPDATE ON health_outreach_missions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_postings BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_applications BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_livelihood_training_workshops BEFORE UPDATE ON livelihood_training_workshops FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_livelihood_enrollment_records BEFORE UPDATE ON livelihood_enrollment_records FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_livelihood_assistance_requests BEFORE UPDATE ON livelihood_assistance_requests FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_ayuda_claim_stubs BEFORE UPDATE ON ayuda_claim_stubs FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_financial_assistance_requests BEFORE UPDATE ON financial_assistance_requests FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_waste_collection_schedules BEFORE UPDATE ON waste_collection_schedules FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_bulk_waste_pickup_requests BEFORE UPDATE ON bulk_waste_pickup_requests FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_bayanihan_clean_up_drives BEFORE UPDATE ON bayanihan_clean_up_drives FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_bayanihan_volunteer_records BEFORE UPDATE ON bayanihan_volunteer_records FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_illegal_dumping_reports BEFORE UPDATE ON illegal_dumping_reports FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_mrf_recyclables_drop_records BEFORE UPDATE ON mrf_recyclables_drop_records FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_sk_tournament_activities BEFORE UPDATE ON sk_tournament_activities FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_sk_registration_records BEFORE UPDATE ON sk_registration_records FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_senior_citizen_benefit_schedules BEFORE UPDATE ON senior_citizen_benefit_schedules FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_assistive_device_requests BEFORE UPDATE ON assistive_device_requests FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_citizen_concerns BEFORE UPDATE ON citizen_concerns FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_barangay_files BEFORE UPDATE ON barangay_files FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ============================================================================
-- 28. REPORTING & ANALYTICS VIEWS
-- ============================================================================

-- View 1: Demographic Master Summary
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

-- View 2: Purok Density & Distribution Summary
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

-- View 3: Monthly Revenue Trajectory
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

-- View 4: Lupon Tagapamayapa Case Resolution Rate
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
-- 29. ROW LEVEL SECURITY (RLS) POLICIES
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

