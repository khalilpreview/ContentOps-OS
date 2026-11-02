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
