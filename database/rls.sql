-- ============================================================================
-- BARANGAY SANGKOL MANAGEMENT & INFORMATION SYSTEM (BS-MIS)
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE & POSTGRESQL
--
-- Security Model:
-- 1. Admin & Staff: Full access (SELECT, INSERT, UPDATE, DELETE) to all records.
-- 2. Residents: Can only access their own records (via resident_id or user_id).
-- 3. Unauthenticated / Anon: Can only submit sign-up requests & read public data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & SCHEMA COMPATIBILITY
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth_id column exists on system_users to link Supabase auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE system_users ADD COLUMN auth_id UUID;
    CREATE INDEX IF NOT EXISTS idx_system_users_auth_id ON system_users(auth_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS (SECURITY DEFINER to prevent recursive RLS evaluations)
-- ----------------------------------------------------------------------------

-- Check if current authenticated caller is an Active Administrator or Barangay Staff
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

-- Get the resident_id linked to the current authenticated caller
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

-- Get the system_users.id of the current authenticated caller
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

-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ----------------------------------------------------------------------------

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

-- Extended modules (if present)
ALTER TABLE IF EXISTS financial_assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ayuda_claim_stubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS livelihood_assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS livelihood_enrollment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS livelihood_training_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medicine_refill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS child_immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_outreach_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facility_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS equipment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS waste_collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bulk_waste_pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bayanihan_clean_up_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bayanihan_volunteer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS illegal_dumping_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mrf_recyclables_drop_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sk_tournament_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sk_registration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS senior_citizen_benefit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assistive_device_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_services ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR CORE ENTITIES
-- ----------------------------------------------------------------------------

-- ============================================================================
-- 4.1 TABLE: system_users
-- ============================================================================
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
  WITH CHECK (
    role = 'Resident' 
    AND status = 'Pending Approval'
  );

-- ============================================================================
-- 4.2 TABLE: residents
-- ============================================================================
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

-- ============================================================================
-- 4.3 TABLE: households
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_households ON households;
CREATE POLICY admin_staff_all_households ON households
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_household ON households;
CREATE POLICY resident_select_own_household ON households
  FOR SELECT TO authenticated
  USING (
    id = (SELECT household_id FROM public.residents WHERE id = public.get_current_resident_id())
  );

-- ============================================================================
-- 4.4 TABLE: household_members
-- ============================================================================
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

-- ============================================================================
-- 4.5 TABLE: barangay_settings
-- ============================================================================
DROP POLICY IF EXISTS public_select_barangay_settings ON barangay_settings;
CREATE POLICY public_select_barangay_settings ON barangay_settings
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS admin_staff_manage_barangay_settings ON barangay_settings;
CREATE POLICY admin_staff_manage_barangay_settings ON barangay_settings
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 4.6 TABLE: barangay_officials
-- ============================================================================
DROP POLICY IF EXISTS public_select_barangay_officials ON barangay_officials;
CREATE POLICY public_select_barangay_officials ON barangay_officials
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS admin_staff_manage_barangay_officials ON barangay_officials;
CREATE POLICY admin_staff_manage_barangay_officials ON barangay_officials
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 4.7 TABLE: certificates
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_certificates ON certificates;
CREATE POLICY admin_staff_all_certificates ON certificates
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_certificates ON certificates;
CREATE POLICY resident_select_own_certificates ON certificates
  FOR SELECT TO authenticated
  USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_certificates ON certificates;
CREATE POLICY resident_insert_own_certificates ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.get_current_resident_id());

-- ============================================================================
-- 4.8 TABLE: appointments
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_appointments ON appointments;
CREATE POLICY admin_staff_all_appointments ON appointments
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_appointments ON appointments;
CREATE POLICY resident_select_own_appointments ON appointments
  FOR SELECT TO authenticated
  USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_appointments ON appointments;
CREATE POLICY resident_insert_own_appointments ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_update_own_appointments ON appointments;
CREATE POLICY resident_update_own_appointments ON appointments
  FOR UPDATE TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- ============================================================================
-- 4.9 TABLE: citizen_concerns & concern_action_logs
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_citizen_concerns ON citizen_concerns;
CREATE POLICY admin_staff_all_citizen_concerns ON citizen_concerns
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_citizen_concerns ON citizen_concerns;
CREATE POLICY resident_select_own_citizen_concerns ON citizen_concerns
  FOR SELECT TO authenticated
  USING (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_citizen_concerns ON citizen_concerns;
CREATE POLICY resident_insert_own_citizen_concerns ON citizen_concerns
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS admin_staff_all_concern_action_logs ON concern_action_logs;
CREATE POLICY admin_staff_all_concern_action_logs ON concern_action_logs
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_concern_action_logs ON concern_action_logs;
CREATE POLICY resident_select_own_concern_action_logs ON concern_action_logs
  FOR SELECT TO authenticated
  USING (
    concern_id IN (
      SELECT id FROM public.citizen_concerns WHERE resident_id = public.get_current_resident_id()
    )
  );

-- ============================================================================
-- 4.10 TABLE: blotters & blotter_activity_logs
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_blotters ON blotters;
CREATE POLICY admin_staff_all_blotters ON blotters
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_blotters ON blotters;
CREATE POLICY resident_select_own_blotters ON blotters
  FOR SELECT TO authenticated
  USING (
    complainant_resident_id = public.get_current_resident_id() 
    OR respondent_resident_id = public.get_current_resident_id()
  );

DROP POLICY IF EXISTS admin_staff_all_blotter_activity_logs ON blotter_activity_logs;
CREATE POLICY admin_staff_all_blotter_activity_logs ON blotter_activity_logs
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

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

-- ============================================================================
-- 4.11 TABLE: complaints
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_complaints ON complaints;
CREATE POLICY admin_staff_all_complaints ON complaints
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_complaints ON complaints;
CREATE POLICY resident_select_own_complaints ON complaints
  FOR SELECT TO authenticated
  USING (
    complainant_id = public.get_current_resident_id() 
    OR respondent_id = public.get_current_resident_id()
  );

DROP POLICY IF EXISTS resident_insert_own_complaints ON complaints;
CREATE POLICY resident_insert_own_complaints ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (complainant_id = public.get_current_resident_id());

-- ============================================================================
-- 4.12 TABLE: businesses
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_businesses ON businesses;
CREATE POLICY admin_staff_all_businesses ON businesses
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_businesses ON businesses;
CREATE POLICY resident_select_own_businesses ON businesses
  FOR SELECT TO authenticated
  USING (owner_resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_insert_own_businesses ON businesses;
CREATE POLICY resident_insert_own_businesses ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (owner_resident_id = public.get_current_resident_id());

DROP POLICY IF EXISTS resident_update_own_businesses ON businesses;
CREATE POLICY resident_update_own_businesses ON businesses
  FOR UPDATE TO authenticated
  USING (owner_resident_id = public.get_current_resident_id())
  WITH CHECK (owner_resident_id = public.get_current_resident_id());

-- ============================================================================
-- 4.13 TABLE: announcements & announcement_attendees
-- ============================================================================
DROP POLICY IF EXISTS public_select_announcements ON announcements;
CREATE POLICY public_select_announcements ON announcements
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS admin_staff_manage_announcements ON announcements;
CREATE POLICY admin_staff_manage_announcements ON announcements
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_all_announcement_attendees ON announcement_attendees;
CREATE POLICY admin_staff_all_announcement_attendees ON announcement_attendees
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_announcement_attendees ON announcement_attendees;
CREATE POLICY resident_manage_own_announcement_attendees ON announcement_attendees
  FOR ALL TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- ============================================================================
-- 4.14 TABLE: community_activities & activity_attendees
-- ============================================================================
DROP POLICY IF EXISTS public_select_community_activities ON community_activities;
CREATE POLICY public_select_community_activities ON community_activities
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS admin_staff_manage_community_activities ON community_activities;
CREATE POLICY admin_staff_manage_community_activities ON community_activities
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_all_activity_attendees ON activity_attendees;
CREATE POLICY admin_staff_all_activity_attendees ON activity_attendees
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_activity_attendees ON activity_attendees;
CREATE POLICY resident_manage_own_activity_attendees ON activity_attendees
  FOR ALL TO authenticated
  USING (resident_id = public.get_current_resident_id())
  WITH CHECK (resident_id = public.get_current_resident_id());

-- ============================================================================
-- 4.15 TABLE: documents & barangay_files
-- ============================================================================
DROP POLICY IF EXISTS public_select_documents ON documents;
CREATE POLICY public_select_documents ON documents
  FOR SELECT TO public
  USING (is_public = TRUE OR status = 'Approved' OR public.is_admin_or_staff());

DROP POLICY IF EXISTS admin_staff_manage_documents ON documents;
CREATE POLICY admin_staff_manage_documents ON documents
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barangay_files') THEN
    EXECUTE '
      DROP POLICY IF EXISTS public_select_barangay_files ON barangay_files;
      CREATE POLICY public_select_barangay_files ON barangay_files
        FOR SELECT TO public
        USING (is_public = TRUE OR public.is_admin_or_staff());

      DROP POLICY IF EXISTS admin_staff_manage_barangay_files ON barangay_files;
      CREATE POLICY admin_staff_manage_barangay_files ON barangay_files
        FOR ALL TO authenticated
        USING (public.is_admin_or_staff())
        WITH CHECK (public.is_admin_or_staff());
    ';
  END IF;
END $$;

-- ============================================================================
-- 4.16 TABLE: financial_transactions
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_financial_transactions ON financial_transactions;
CREATE POLICY admin_staff_all_financial_transactions ON financial_transactions
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_select_own_financial_transactions ON financial_transactions;
CREATE POLICY resident_select_own_financial_transactions ON financial_transactions
  FOR SELECT TO authenticated
  USING (
    certificate_id IN (
      SELECT id FROM public.certificates WHERE resident_id = public.get_current_resident_id()
    )
  );

-- ============================================================================
-- 4.17 TABLE: audit_logs
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_audit_logs ON audit_logs;
CREATE POLICY admin_staff_all_audit_logs ON audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS authenticated_insert_audit_logs ON audit_logs;
CREATE POLICY authenticated_insert_audit_logs ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 4.18 TABLE: system_notifications
-- ============================================================================
DROP POLICY IF EXISTS admin_staff_all_system_notifications ON system_notifications;
CREATE POLICY admin_staff_all_system_notifications ON system_notifications
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS resident_manage_own_notifications ON system_notifications;
CREATE POLICY resident_manage_own_notifications ON system_notifications
  FOR ALL TO authenticated
  USING (
    recipient_id = public.get_current_resident_id()
    OR user_id = public.get_current_user_id()
  )
  WITH CHECK (
    recipient_id = public.get_current_resident_id()
    OR user_id = public.get_current_user_id()
  );

-- ============================================================================
-- 4.19 EXTENDED COMMUNITY SERVICES (Welfare, Ayuda, Health, Reservations)
-- ============================================================================
DO $$
BEGIN
  -- financial_assistance_requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_assistance_requests') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_financial_assist ON financial_assistance_requests;
      CREATE POLICY admin_staff_financial_assist ON financial_assistance_requests FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_financial_assist ON financial_assistance_requests;
      CREATE POLICY resident_financial_assist ON financial_assistance_requests FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- ayuda_claim_stubs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ayuda_claim_stubs') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_ayuda ON ayuda_claim_stubs;
      CREATE POLICY admin_staff_ayuda ON ayuda_claim_stubs FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_ayuda ON ayuda_claim_stubs;
      CREATE POLICY resident_ayuda ON ayuda_claim_stubs FOR SELECT TO authenticated USING (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- health_appointments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_appointments') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_health_apt ON health_appointments;
      CREATE POLICY admin_staff_health_apt ON health_appointments FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_health_apt ON health_appointments;
      CREATE POLICY resident_health_apt ON health_appointments FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- medicine_refill_requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicine_refill_requests') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_med_refill ON medicine_refill_requests;
      CREATE POLICY admin_staff_med_refill ON medicine_refill_requests FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_med_refill ON medicine_refill_requests;
      CREATE POLICY resident_med_refill ON medicine_refill_requests FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- facility_reservations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facility_reservations') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_facility_res ON facility_reservations;
      CREATE POLICY admin_staff_facility_res ON facility_reservations FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_facility_res ON facility_reservations;
      CREATE POLICY resident_facility_res ON facility_reservations FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- equipment_reservations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_reservations') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_equip_res ON equipment_reservations;
      CREATE POLICY admin_staff_equip_res ON equipment_reservations FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_equip_res ON equipment_reservations;
      CREATE POLICY resident_equip_res ON equipment_reservations FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- bulk_waste_pickup_requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bulk_waste_pickup_requests') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_bulk_waste ON bulk_waste_pickup_requests;
      CREATE POLICY admin_staff_bulk_waste ON bulk_waste_pickup_requests FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_bulk_waste ON bulk_waste_pickup_requests;
      CREATE POLICY resident_bulk_waste ON bulk_waste_pickup_requests FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;

  -- assistive_device_requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assistive_device_requests') THEN
    EXECUTE '
      DROP POLICY IF EXISTS admin_staff_assist_dev ON assistive_device_requests;
      CREATE POLICY admin_staff_assist_dev ON assistive_device_requests FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
      DROP POLICY IF EXISTS resident_assist_dev ON assistive_device_requests;
      CREATE POLICY resident_assist_dev ON assistive_device_requests FOR ALL TO authenticated USING (resident_id = public.get_current_resident_id()) WITH CHECK (resident_id = public.get_current_resident_id());
    ';
  END IF;
END $$;
