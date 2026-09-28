-- ============================================================================
-- FIX & UPGRADE SCRIPT FOR SUPABASE: barangay_settings TABLE
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query)
-- ============================================================================

-- 1. Ensure all required columns exist in barangay_settings
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS republic_logo_url TEXT;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS captain_signature_url TEXT;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS term_start DATE;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS term_end DATE;
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS sk_chairperson VARCHAR(150);
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS barangay_captain VARCHAR(150);
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS kagawads TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'light';
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS is_dark_mode BOOLEAN DEFAULT FALSE;

-- 2. Ensure default record with ID = 1 exists
INSERT INTO barangay_settings (
    id,
    barangay_name,
    municipality,
    province,
    region,
    zip_code,
    punong_barangay,
    barangay_secretary,
    barangay_treasurer,
    contact_number,
    email,
    hall_address,
    office_hours,
    puroks
) VALUES (
    1,
    'Barangay Sangkol',
    'City of Dipolog',
    'Province of Zamboanga del Norte',
    'Region IX - Zamboanga Peninsula',
    '7100',
    'Hon. Rogelio D. Regañon',
    'Atty. Maria Elena V. Ramos',
    'Mrs. Cynthia T. Bautista',
    '(062) 991-8842 / 0917-890-4421',
    'barangay.sangkol.office@gov.ph',
    'Barangay Hall Complex, Purok Mangga, Barangay Sangkol',
    'Monday - Friday: 8:00 AM - 5:00 PM',
    ARRAY['Purok Pinya', 'Purok Mangga', 'Purok Tambis', 'Purok Bayabas', 'Purok Caimito', 'Purok Lomboy']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Update RLS policies to allow anon/authenticated read and update
ALTER TABLE barangay_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of barangay_settings" ON barangay_settings;
CREATE POLICY "Allow public read of barangay_settings" ON barangay_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert of barangay_settings" ON barangay_settings;
CREATE POLICY "Allow public insert of barangay_settings" ON barangay_settings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update of barangay_settings" ON barangay_settings;
CREATE POLICY "Allow public update of barangay_settings" ON barangay_settings
    FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
