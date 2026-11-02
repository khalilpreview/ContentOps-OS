-- =========================================================================
-- Thrill ContentOps OS: Supabase Database Schema & RLS Policies
-- Execute this script in your Supabase Dashboard SQL Editor
-- =========================================================================

-- 1. Create content_assets table
CREATE TABLE IF NOT EXISTS public.content_assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  pillar TEXT NOT NULL DEFAULT 'CONTENT_OPS',
  format_tier TEXT NOT NULL DEFAULT 'HUB',
  status TEXT NOT NULL DEFAULT 'DRAFT_BRIEF',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  parent_id TEXT,
  parent_title TEXT,
  hook_strategy TEXT,
  target_audience TEXT,
  platform_specs TEXT,
  safe_zone_requirements TEXT,
  target_kpi TEXT,
  raw_intake_notes TEXT,
  sla_hours INTEGER NOT NULL DEFAULT 48,
  sla_started_at TIMESTAMPTZ,
  sla_expires_at TIMESTAMPTZ,
  is_sla_breached BOOLEAN NOT NULL DEFAULT false,
  qa_tone_approved BOOLEAN NOT NULL DEFAULT false,
  qa_specs_validated BOOLEAN NOT NULL DEFAULT false,
  qa_rights_cleared BOOLEAN NOT NULL DEFAULT false,
  qa_gatekeeper_signed BOOLEAN NOT NULL DEFAULT false,
  qa_signed_by_id TEXT,
  qa_signed_by_name TEXT,
  qa_signed_at TIMESTAMPTZ,
  deliverable_url TEXT,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  retention_rate_3s NUMERIC,
  reach_impressions TEXT,
  is_winning_format BOOLEAN NOT NULL DEFAULT false,
  paid_eligible BOOLEAN NOT NULL DEFAULT false,
  sent_to_paid_ads BOOLEAN NOT NULL DEFAULT false,
  created_by_id TEXT NOT NULL,
  assigned_to_id TEXT,
  target_publish_at TIMESTAMPTZ,
  history JSONB DEFAULT '[]'::jsonb,
  generated_hooks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create profiles table (synced with Supabase Auth & Application Settings)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'CONTENT_MANAGER',
  avatar_url TEXT,
  team TEXT DEFAULT 'Executive ContentOps Pod',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Legacy alias table for user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'CONTENT_MANAGER',
  avatar_url TEXT,
  department TEXT DEFAULT 'Executive ContentOps Pod',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Indexes for High-Velocity Kanban & Dashboard queries
CREATE INDEX IF NOT EXISTS idx_content_assets_status ON public.content_assets (status);
CREATE INDEX IF NOT EXISTS idx_content_assets_pillar ON public.content_assets (pillar);
CREATE INDEX IF NOT EXISTS idx_content_assets_tier ON public.content_assets (format_tier);
CREATE INDEX IF NOT EXISTS idx_content_assets_created_at ON public.content_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_assets_parent_id ON public.content_assets (parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles (team);

-- 4. Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_assets_updated_at ON public.content_assets;
CREATE TRIGGER trigger_content_assets_updated_at
  BEFORE UPDATE ON public.content_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Trigger to automatically create profile when new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url, team)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CONTENT_MANAGER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    COALESCE(NEW.raw_user_meta_data->>'team', 'Executive ContentOps Pod')
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    team = EXCLUDED.team,
    name = EXCLUDED.name,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_profiles (id, email, name, role, avatar_url, department)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CONTENT_MANAGER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    COALESCE(NEW.raw_user_meta_data->>'team', 'Executive ContentOps Pod')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Authenticated operators full access, users can only modify their own profile
-- Content Assets: Public read for client preview/dashboard, but only authenticated operators can modify
CREATE POLICY "Allow read content_assets"
  ON public.content_assets FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert content_assets"
  ON public.content_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update content_assets"
  ON public.content_assets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete content_assets"
  ON public.content_assets FOR DELETE
  TO authenticated
  USING (true);

-- Profiles: Public read for avatar/author attribution, updates strictly scoped to owning user
CREATE POLICY "Allow read profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Legacy user_profiles table RLS hardening
CREATE POLICY "Allow read user_profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users update own user_profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 8. Seed Initial Content Assets into Supabase
INSERT INTO public.content_assets (
  id, title, description, pillar, format_tier, status, priority, hook_strategy,
  platform_specs, target_kpi, raw_intake_notes, sla_hours, sla_started_at, sla_expires_at,
  is_sla_breached, qa_tone_approved, qa_specs_validated, qa_rights_cleared, qa_gatekeeper_signed,
  deliverable_url, attachment_count, created_by_id, assigned_to_id, created_at, updated_at
) VALUES 
(
  'asset-hero-101',
  'Q3 Global Keynote: Autonomous ContentOps & Enterprise AI Orchestration',
  'Flagship 45-minute executive keynote revealing how Fortune 500 media teams enforce SLA gates.',
  'STRATEGY_SERIES', 'HERO', 'READY_TO_PUBLISH', 'URGENT',
  'Contrarian: "The enterprise content backlog is not a bandwidth problem—it is a missing state machine."',
  '16:9 4K (3840x2160) @ 60fps Pro-Res 422 HQ master + SRT caption tracks.',
  '100k+ Executive views, 2,500 qualified pipeline leads, 72% 5-minute retention.',
  'Keynote delivery by CMO. Focus on RACI governance, cutting review latency down to 48 hours.',
  48, now() - INTERVAL '72 hours', now() - INTERVAL '24 hours', false,
  true, true, true, true,
  'https://frame.io/player/keynote-master-4k-final', 4,
  'u-cm', 'u-cs', now() - INTERVAL '72 hours', now() - INTERVAL '4 hours'
),
(
  'asset-qa-401',
  'Weekly Tech Pulse: Multi-Agent Workflows Explained in 60s',
  'Bite-sized animated explainer breaking down how specialized coding and research agents coordinate.',
  'CONTENT_OPS', 'HUB', 'QA_GATE', 'HIGH',
  'Direct Value: "One agent writes the test. Another writes the code. Here is how they avoid circular loops."',
  '1080x1920 (9:16), 60fps, -14 LUFS stereo audio, 58 seconds duration, burnt-in kinetic captions.',
  '70% 3-Second Retention Rate, >15% Share Rate, 5,000 saves on LinkedIn and TikTok.',
  'Master cut rendered and audio leveled to -14 LUFS. Waiting on Brand Guardianship 4-point QA Gatekeeper sign-off.',
  24, now() - INTERVAL '30 hours', now() - INTERVAL '6 hours', false,
  true, true, false, false,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 2,
  'u-cs', 'u-cs', now() - INTERVAL '30 hours', now() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 9. Post-Deployment Production Monitoring: Client-Side Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'fatal')),
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  user_role TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for logs querying & filtering
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_event ON public.logs (event);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs (user_id);

-- Enable Row Level Security on logs table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Allow public insert so client-side errors can be posted (including unauthenticated or pre-login errors)
CREATE POLICY "Allow public insert logs"
  ON public.logs FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view logs for production monitoring and auditing
CREATE POLICY "Allow authenticated read logs"
  ON public.logs FOR SELECT
  USING (true);


-- =========================================================================
-- 10. Enterprise Audit Trail: asset_activities
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.asset_activities (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performer_name TEXT,
  performer_role TEXT,
  action TEXT NOT NULL,
  previous_stage TEXT,
  new_stage TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_asset_activities_asset_id ON public.asset_activities (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_activities_created_at ON public.asset_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_activities_performed_by ON public.asset_activities (performed_by);

ALTER TABLE public.asset_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read asset_activities"
  ON public.asset_activities FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert asset_activities"
  ON public.asset_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- =========================================================================
-- Thrill ContentOps OS: Migration 20261103_super_admin_and_invites
-- Supports: Super Admin Role, User Status, Magic Link Invites, and Audit Logs
-- =========================================================================

-- 1. Extend profiles table with status, invite tracking, and super admin capabilities
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by TEXT;

-- 2. Extend legacy user_profiles table for backwards compatibility
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by TEXT;

-- 3. Update handle_new_user trigger to preserve pre-assigned role on invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  preassigned_role TEXT;
  preassigned_team TEXT;
BEGIN
  -- Check if user was pre-provisioned by Super Admin before clicking magic link
  SELECT role, team INTO preassigned_role, preassigned_team 
  FROM public.profiles 
  WHERE email = LOWER(NEW.email) 
  LIMIT 1;

  INSERT INTO public.profiles (id, email, name, role, avatar_url, team, status, updated_at)
  VALUES (
    NEW.id::text,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(preassigned_role, NEW.raw_user_meta_data->>'role', 'CONTENT_MANAGER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    COALESCE(preassigned_team, NEW.raw_user_meta_data->>'team', 'Executive ContentOps Pod'),
    'active',
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    status = 'active',
    updated_at = timezone('utc'::text, now());

  -- Mirror to user_profiles
  INSERT INTO public.user_profiles (id, email, name, role, avatar_url, department, status, updated_at)
  VALUES (
    NEW.id::text,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(preassigned_role, NEW.raw_user_meta_data->>'role', 'CONTENT_MANAGER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    COALESCE(preassigned_team, NEW.raw_user_meta_data->>'team', 'Executive ContentOps Pod'),
    'active',
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policy: Super Admins and Content Managers can manage all profiles
DROP POLICY IF EXISTS "Allow super admins and content managers update all profiles" ON public.profiles;
CREATE POLICY "Allow super admins and content managers update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()::text AND role IN ('SUPER_ADMIN', 'CONTENT_MANAGER')
    )
    OR auth.uid()::text = id
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow super admins insert profiles" ON public.profiles;
CREATE POLICY "Allow super admins insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow super admins delete profiles" ON public.profiles;
CREATE POLICY "Allow super admins delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()::text AND role IN ('SUPER_ADMIN', 'CONTENT_MANAGER')
    )
  );

-- 5. Seed default Super Admin user profile if not present
INSERT INTO public.profiles (id, email, name, role, team, status)
VALUES 
  ('u-superadmin', 'elena@thrill.com', 'Elena Vance (Super Admin)', 'SUPER_ADMIN', 'Executive Governance Pod', 'active'),
  ('u-admin-root', 'admin@thrill.com', 'System Administrator', 'SUPER_ADMIN', 'Executive Governance Pod', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = 'SUPER_ADMIN',
  status = 'active',
  updated_at = timezone('utc'::text, now());
