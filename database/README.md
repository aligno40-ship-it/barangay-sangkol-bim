# 🏛️ Barangay Sangkol Database (PostgreSQL)

This folder contains the complete PostgreSQL database definitions, relational tables, constraints, analytical views, and initial seed data for the **Barangay Sangkol Management and Information System**.

---

## 📁 Files Included

| File | Description |
| :--- | :--- |
| **`init.sql`** | **⭐ Recommended (1-Step Import)**: Consolidated script containing extensions, all 22 tables, foreign key constraints, triggers, analytical reporting views, complete initial seed data, and Row Level Security (RLS) policies. |
| **`schema.sql`** | Clean DDL-only script containing table structures, indices, triggers, analytical views, and RLS policies (without seed rows). |
| **`rls.sql`** | **🛡️ Supabase Row Level Security (RLS)**: Standalone RLS configuration script defining helper functions, table security activation, and fine-grained access policies for Residents, Admin/Staff, and Public visitors. |
| **`seed.sql`** | DML-only script containing sample residents, households, officials, blotters, certificates, revenues, etc. |
| **`../docker-compose.yml`** | Ready-to-use Docker configuration launching PostgreSQL 16 on port `5432` and pgAdmin 4 on port `5050` with auto-loaded data. |

---

## 🚀 How to Import into PostgreSQL in VS Code

### Option 1: Using Docker (Fastest & Easiest — 0 Manual DB Installation)

If you have Docker / Docker Desktop installed:

1. Open VS Code in the project root directory.
2. In the terminal, run:
   ```bash
   docker compose up -d
   ```
3. PostgreSQL is now running and **automatically pre-loaded** with all tables and data!
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `barangay_sangkol_db`
   - **Username:** `postgres`
   - **Password:** `postgrespassword`
4. Access **pgAdmin 4 Web GUI** at [http://localhost:5050](http://localhost:5050)
   - **Email:** `admin@barangay.gov.ph`
   - **Password:** `adminpassword`

---

### Option 2: Using the PostgreSQL CLI (`psql`)

If you have PostgreSQL installed locally on your machine:

1. Create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE barangay_sangkol_db;"
   ```
2. Import the `init.sql` file:
   ```bash
   psql -U postgres -d barangay_sangkol_db -f database/init.sql
   ```

*(If you are prompted for a password, enter your PostgreSQL master password).*

---

### Option 3: Using pgAdmin 4 GUI

1. Open **pgAdmin 4**.
2. Right-click on **Databases** > **Create** > **Database...**
   - Name: `barangay_sangkol_db`
   - Click **Save**.
3. Right-click on `barangay_sangkol_db` > **Query Tool**.
4. Click the **Open File (Folder icon)** button or press `Ctrl + O` / `Cmd + O`.
5. Browse and select `database/init.sql` from your project folder.
6. Click the **Execute (Play button / F5)**.
7. Refresh your schema tables in the left sidebar to see all 22 tables and 4 views populated.

---

### Option 4: Using VS Code Extensions

You can manage PostgreSQL directly inside VS Code:

1. Install one of these popular VS Code extensions:
   - **PostgreSQL** by *Chris Kolkman* (`ckolkman.vscode-postgres`)
   - **Database Client** by *cweijan* (`cweijan.vscode-database-client2`)
   - **SQLTools** + **SQLTools PostgreSQL Driver**
2. Connect to your database:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Database: `barangay_sangkol_db`
3. Open `database/init.sql` in VS Code and click **Run Query** / **Execute All**.

---

## 🗄️ Database Structure Overview

### Core Tables
- `barangay_settings` — General barangay profile, ordinance fee rates, official seals, and purok lists.
- `residents` — Registry of Barangay Inhabitants (RBI Form 1A) with demographic tags, contact details, PhilSys/SSS IDs, voter records, and sectoral tags (Seniors, PWDs, 4Ps, Youth).
- `households` — Household family units (RBI Form 1B), socioeconomic housing type, water source, sanitation, and electricity.
- `household_members` — Household relations (Head, Spouse, Child, Relative).
- `barangay_officials` — Sangguniang Barangay, SK officials, Tanod chiefs, committee assignments, and term durations.
- `system_users` — Role-based system accounts (Admin, Captain, Secretary, Treasurer, Tanod, Residents) with security questions.

### Operations & Peace/Order
- `certificates` — Issued clearances (Barangay Clearance, Indigency, Residency, Good Moral) with control numbers and official receipt references.
- `blotters` — Peace and order incident records, hearing dates, PNP endorsements, and settlement statuses.
- `blotter_activity_logs` — Detailed chronological workflow logs of summons, hearings, and amicably settled agreements.
- `complaints` — Katarungang Pambarangay (KP) dispute proceedings, mediation rounds, and Certificate to File Action (CFA).
- `businesses` — Commercial establishments, capitalization, gross sales, and local business clearances.

### Community & Public Services
- `announcements` & `announcement_attendees` — Barangay assemblies and registration rosters.
- `community_activities` & `activity_attendees` — Medical missions, clean-up drives, sports leagues.
- `citizen_concerns` & `concern_action_logs` — Resident feedback tickets, priority triage, and resolution notes.
- `appointments` — Official calendar schedules with the Barangay Captain and Secretariat.
- `documents` — Barangay ordinances, resolutions, disaster plans, and executive orders.
- `financial_transactions` — Official Receipts (OR) revenue collection journal.
- `audit_logs` — System activity audit trail.
- `system_notifications` — Real-time notification queue.

### 📊 Built-in Analytical Views
- `v_demographic_summary` — Live count of population, gender ratio, seniors, PWDs, 4Ps, youth, and registered voters.
- `v_purok_population` — Population breakdown, household counts, and voter registration density across Puroks.
- `v_monthly_revenue` — Aggregated monthly revenue collection per clearance and service type.
- `v_lupon_settlement_rate` — Lupon dispute resolution efficiency and amicable settlement percentage.

---

## 🛡️ Row Level Security (RLS) Policy Architecture

All tables are protected with PostgreSQL Row Level Security (RLS) policies configured for Supabase Auth:

1. **Admin & Staff Roles** (`Administrator`, `Barangay Captain`, `Barangay Secretary`, `Barangay Treasurer`, `Barangay Tanod`, `Barangay Staff`, `Barangay Official`):
   - Full access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) across all system tables.
   - Evaluated via `public.is_admin_or_staff()` with `SECURITY DEFINER` context.

2. **Resident Citizen Role** (`Resident`):
   - Restricted to their own data matching their linked `resident_id` or `user_id`:
     - `residents`: Read and update their own demographic record (`id = get_current_resident_id()`).
     - `households` & `household_members`: Access only their linked household and family members.
     - `certificates`: View their certificate history and submit new certificate requests.
     - `appointments`: View their appointments and book/cancel appointments.
     - `citizen_concerns` & `concern_action_logs`: Submit tickets and track status updates.
     - `blotters` & `complaints`: View cases where they are the complainant or respondent.
     - `businesses`: Manage commercial permits for businesses they own.
     - `system_users`: Read and update their own account profile.

3. **Unauthenticated / Anonymous Visitors** (`anon`):
   - **Allowed**: Read public barangay settings, announcements, activities, and published documents.
   - **Allowed**: Submit resident registration sign-up requests (`role = 'Resident'` and `status = 'Pending Approval'`).
   - **Forbidden**: Accessing private resident records, blotters, certificates, financial transactions, or administrative audit logs.

To apply or update RLS policies in your Supabase project, execute `database/rls.sql` directly in the Supabase SQL Editor.

---

## 🔑 Default Seed Accounts for Testing

| Username | Password | Role | Position |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | Administrator | Punong Barangay & Admin |
| `secretary` | `secretary123` | Barangay Secretary | Secretariat & Records |
| `treasurer` | `treasurer123` | Barangay Treasurer | Treasury & Collections |
| `tanod` | `tanod123` | Barangay Tanod | Chief Tanod / BPSO |
| `resident.maria` | `resident123` | Resident | Verified Resident |
| `aligno40@gmail.com` | `resident123` | Resident | Verified Resident |
