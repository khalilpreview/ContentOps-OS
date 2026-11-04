-- Migration: Add yanling.lin@pradym.io as designated Super Administrator

-- Insert or update profile for yanling.lin@pradym.io
INSERT INTO public.profiles (id, email, name, role, team, status)
VALUES 
  ('u-superadmin-yanling', 'yanling.lin@pradym.io', 'Yanling Lin (Super Admin)', 'SUPER_ADMIN', 'Executive Governance Pod', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = 'SUPER_ADMIN',
  status = 'active',
  updated_at = timezone('utc'::text, now());

-- Update any existing profile row with yanling.lin@pradym.io to SUPER_ADMIN
UPDATE public.profiles
SET role = 'SUPER_ADMIN', status = 'active', updated_at = timezone('utc'::text, now())
WHERE LOWER(email) = 'yanling.lin@pradym.io';
