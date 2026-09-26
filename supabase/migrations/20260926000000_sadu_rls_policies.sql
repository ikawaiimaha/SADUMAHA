-- ===========================================================================
-- SADU SCHEMA & RLS POLICIES - INSTITUTIONAL ROLE MAPPING
-- Assumes user roles are stored in Supabase Auth JWT claims as 'institutional_role'
-- ===========================================================================

-- 0. SCHEMA DEFINITIONS & RLS ACTIVATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.themes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  arabic_name text,
  english_name text,
  definition text,
  status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artist_dossiers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  arabic_name text NOT NULL,
  category text NOT NULL,
  nationality text NOT NULL,
  medium text NOT NULL,
  status text NOT NULL DEFAULT 'INCOMPLETE_DOSSIER',
  rejection_reason text,
  is_commissioned boolean NOT NULL DEFAULT true,
  cv_url text,
  portfolio_url text,
  mockups_url text,
  submitted_by text DEFAULT 'COORDINATOR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bilateral_contracts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  artist_id uuid,
  artist_name text NOT NULL,
  artist_category text,
  nationality text,
  medium text,
  proposed_work_title text,
  production_cost numeric NOT NULL DEFAULT 0,
  shipping_terms text,
  cancellation_clause_mandatory boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'NOT_DRAFTED',
  is_signed boolean NOT NULL DEFAULT false,
  tranches jsonb DEFAULT '{}'::jsonb,
  documents jsonb DEFAULT '{}'::jsonb,
  audit_trail jsonb DEFAULT '[]'::jsonb,
  signed_at timestamptz,
  signature_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bilateral_contracts ENABLE ROW LEVEL SECURITY;


-- 1. THEMES (Stages 1 & 2)
-- ---------------------------------------------------------------------------
-- Preparatory Committee can create and edit drafts
DROP POLICY IF EXISTS "Committee can draft themes" ON public.themes;
CREATE POLICY "Committee can draft themes"
ON public.themes FOR ALL
USING (auth.jwt() ->> 'institutional_role' = 'PREPARATORY_COMMITTEE');

-- Chairman can view all and update status to PENDING_EDITORIAL_POLISH
DROP POLICY IF EXISTS "Chairman can ratify themes" ON public.themes;
CREATE POLICY "Chairman can ratify themes"
ON public.themes FOR UPDATE
USING (auth.jwt() ->> 'institutional_role' = 'CHAIRMAN');

-- Editorial can view and update translated fields to PUBLISHED_OFFICIAL
DROP POLICY IF EXISTS "Editorial can publish themes" ON public.themes;
CREATE POLICY "Editorial can publish themes"
ON public.themes FOR UPDATE
USING (auth.jwt() ->> 'institutional_role' = 'EDITORIAL_DEPARTMENT');


-- 2. ARTIST DOSSIERS (Stages 4 & 5)
-- ---------------------------------------------------------------------------
-- Coordinators can build and manage dossiers
DROP POLICY IF EXISTS "Coordinators manage dossiers" ON public.artist_dossiers;
CREATE POLICY "Coordinators manage dossiers"
ON public.artist_dossiers FOR ALL
USING (auth.jwt() ->> 'institutional_role' = 'COORDINATOR');

-- Biennial Director can view dossiers and update status to APPROVED or VETOED
DROP POLICY IF EXISTS "Director can execute vetoes and approvals" ON public.artist_dossiers;
CREATE POLICY "Director can execute vetoes and approvals"
ON public.artist_dossiers FOR UPDATE
USING (auth.jwt() ->> 'institutional_role' = 'BIENNIAL_DIRECTOR')
WITH CHECK (
  -- Enforce mandatory rejection reason if vetoed
  (status = 'DIRECTOR_VETOED' AND rejection_reason IS NOT NULL) OR 
  (status = 'DIRECTOR_APPROVED')
);

-- PR & Protocol can view approved dossiers to verify passports
DROP POLICY IF EXISTS "PR can view approved dossiers" ON public.artist_dossiers;
CREATE POLICY "PR can view approved dossiers"
ON public.artist_dossiers FOR SELECT
USING (auth.jwt() ->> 'institutional_role' = 'PR_PROTOCOL' AND status IN ('DIRECTOR_APPROVED', 'LOGISTICS_PENDING_PR', 'CLEARED_FOR_FINANCE'));


-- 3. BILATERAL CONTRACTS (Stages 6 & 7)
-- ---------------------------------------------------------------------------
-- Coordinators draft and dispatch contracts
DROP POLICY IF EXISTS "Coordinators draft contracts" ON public.bilateral_contracts;
CREATE POLICY "Coordinators draft contracts"
ON public.bilateral_contracts FOR ALL
USING (auth.jwt() ->> 'institutional_role' = 'COORDINATOR');

-- Finance can view locked contracts and execute payment tranches
DROP POLICY IF EXISTS "Finance executes payments" ON public.bilateral_contracts;
CREATE POLICY "Finance executes payments"
ON public.bilateral_contracts FOR UPDATE
USING (auth.jwt() ->> 'institutional_role' = 'FINANCE');

-- Artists can view and sign their own contracts
DROP POLICY IF EXISTS "Artists view own contracts" ON public.bilateral_contracts;
CREATE POLICY "Artists view own contracts"
ON public.bilateral_contracts FOR SELECT
USING (auth.uid() = artist_id);

DROP POLICY IF EXISTS "Artists sign own contracts" ON public.bilateral_contracts;
CREATE POLICY "Artists sign own contracts"
ON public.bilateral_contracts FOR UPDATE
USING (auth.uid() = artist_id)
WITH CHECK (is_signed = TRUE);
