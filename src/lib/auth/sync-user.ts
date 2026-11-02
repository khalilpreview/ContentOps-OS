import { getServerSupabaseClient, getServerSupabaseConfig } from '../serverSupabase';
import { User, UserRole } from './types';
import { SEED_USERS } from '../seedData';

// Designated emails automatically promoted to SUPER_ADMIN
export const DESIGNATED_SUPER_ADMINS = [
  'elena@thrill.com',
  'admin@thrill.com',
  'superadmin@thrill.com'
];

// Designated emails automatically promoted to CONTENT_MANAGER
export const DESIGNATED_CONTENT_MANAGERS = [
  'content.manager@thrill.com',
  'elena.vance@thrill.com'
];

// In-memory fallback user registry for offline development and unit tests
const fallbackUserStore = new Map<string, User>(
  SEED_USERS.map((u) => [u.id, { ...u }])
);

// Map email to user in fallback store
SEED_USERS.forEach((u) => {
  if (u.email) fallbackUserStore.set(u.email.toLowerCase(), { ...u });
});

export interface AuthUserInput {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    role?: UserRole;
    team?: string;
    department?: string;
    [key: string]: any;
  };
}

/**
 * Synchronizes a Supabase Auth user into the database profiles/user table.
 * If user does not exist, provisions a new record with default role 'CREATIVE_SPECIALIST'
 * (or 'SUPER_ADMIN' / 'CONTENT_MANAGER' if email is designated).
 */
export async function syncUser(authUser: AuthUserInput): Promise<User> {
  const email = (authUser.email || '').trim().toLowerCase();
  const id = authUser.id;
  const isSuperAdmin = DESIGNATED_SUPER_ADMINS.includes(email);
  const isContentManager = DESIGNATED_CONTENT_MANAGERS.includes(email);
  const metadata = authUser.user_metadata || {};

  const name =
    metadata.name ||
    (email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'ContentOps Operator');
  const formattedName = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const resolvedRole: UserRole = isSuperAdmin
    ? 'SUPER_ADMIN'
    : isContentManager
    ? 'CONTENT_MANAGER'
    : (metadata.role as UserRole) || 'CREATIVE_SPECIALIST';

  const defaultAvatar =
    metadata.avatar_url ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const team = metadata.team || metadata.department || 'Enterprise ContentOps Pod';

  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      // 1. Check if profile exists
      const { data: existing, error: selectErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (selectErr) {
        console.warn('Server Supabase select profile error:', selectErr.message);
      }

      if (existing) {
        return {
          id: existing.id,
          name: existing.name || formattedName,
          email: existing.email || email,
          role: (existing.role as UserRole) || resolvedRole,
          avatarUrl: existing.avatar_url || defaultAvatar,
          team: existing.team || team
        };
      }

      // 2. Insert new profile
      const newProfile = {
        id,
        email,
        name: formattedName,
        role: resolvedRole,
        avatar_url: defaultAvatar,
        team
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertErr) {
        console.warn('Server Supabase insert profile error:', insertErr.message);
      }

      if (inserted) {
        return {
          id: inserted.id,
          name: inserted.name,
          email: inserted.email,
          role: inserted.role as UserRole,
          avatarUrl: inserted.avatar_url,
          team: inserted.team
        };
      }
    } catch (err) {
      console.warn('Supabase syncUser failed, falling back to local registry:', err);
    }
  }

  // Fallback for local/offline execution
  let local = fallbackUserStore.get(id) || (email ? fallbackUserStore.get(email) : undefined);
  if (!local) {
    local = {
      id,
      name: formattedName,
      email,
      role: resolvedRole,
      avatarUrl: defaultAvatar,
      team
    };
    fallbackUserStore.set(id, local);
    if (email) fallbackUserStore.set(email, local);
  } else if (isSuperAdmin && local.role !== 'SUPER_ADMIN') {
    local.role = 'SUPER_ADMIN';
  } else if (isContentManager && local.role !== 'CONTENT_MANAGER' && local.role !== 'SUPER_ADMIN') {
    local.role = 'CONTENT_MANAGER';
  }

  return local;
}

/**
 * Admin utility to promote a user to CONTENT_MANAGER or any designated role
 */
export async function promoteUserToRole(
  identifier: string,
  newRole: UserRole
): Promise<User | null> {
  const trimmed = identifier.trim().toLowerCase();
  const config = getServerSupabaseConfig();

  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .or(`id.eq.${identifier},email.eq.${trimmed}`)
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          avatarUrl: data.avatar_url,
          team: data.team
        };
      }
    } catch (err) {
      console.warn('promoteUserToRole error:', err);
    }
  }

  // Update fallback store
  const local = fallbackUserStore.get(identifier) || fallbackUserStore.get(trimmed);
  if (local) {
    local.role = newRole;
    return local;
  }
  return null;
}

/**
 * Find user by ID or email from memory store
 */
export function getUserById(identifier: string): User | null {
  const trimmed = identifier.trim().toLowerCase();
  return fallbackUserStore.get(identifier) || fallbackUserStore.get(trimmed) || null;
}

/**
 * Return all registered/synced users from Supabase or fallback store
 */
export async function getAllUsers(): Promise<User[]> {
  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name || d.email?.split('@')[0] || 'Operator',
          email: d.email || '',
          role: d.role as UserRole,
          avatarUrl: d.avatar_url,
          team: d.team,
          status: d.status || 'active',
          invitedAt: d.invited_at,
          invitedBy: d.invited_by,
        }));
      }
    } catch (err) {
      console.warn('getAllUsers Supabase error:', err);
    }
  }

  // Deduplicate fallback store
  const seen = new Set<string>();
  const users: User[] = [];
  fallbackUserStore.forEach((u) => {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      users.push(u);
    }
  });
  return users;
}

/**
 * Super Admin invite user:
 * Pre-provisions user record in profiles and issues a Supabase Auth Magic Link invitation.
 */
export async function inviteUser(params: {
  email: string;
  name?: string;
  role: UserRole;
  team?: string;
  invitedBy?: string;
  redirectTo?: string;
}): Promise<{ user: User; magicLinkSent: boolean; message: string }> {
  const email = params.email.trim().toLowerCase();
  const name = params.name?.trim() || email.split('@')[0];
  const role = params.role || 'CREATIVE_SPECIALIST';
  const team = params.team || 'Executive ContentOps Pod';
  const config = getServerSupabaseConfig();

  const tempId = `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let magicLinkSent = false;
  let resultUser: User = {
    id: tempId,
    name,
    email,
    role,
    team,
    status: 'invited',
    invitedAt: now,
    invitedBy: params.invitedBy,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
  };

  if (config.isConfigured) {
    const supabase = getServerSupabaseClient();
    try {
      // 1. Check if user already exists in profiles
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      const targetId = existing?.id || tempId;
      resultUser.id = targetId;

      // 2. Pre-provision/update in profiles
      await supabase.from('profiles').upsert({
        id: targetId,
        email,
        name,
        role,
        team,
        status: 'invited',
        invited_at: now,
        invited_by: params.invitedBy,
        avatar_url: resultUser.avatarUrl,
        updated_at: now,
      });

      // 3. Trigger Supabase Auth Magic Link
      // First try auth.admin.inviteUserByEmail if service role key is available
      try {
        const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { name, role, team },
          redirectTo: params.redirectTo || 'https://thrill-contentops.netlify.app',
        });

        if (!inviteErr) {
          magicLinkSent = true;
        } else {
          // Fallback to signInWithOtp
          const { error: otpErr } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: params.redirectTo || 'https://thrill-contentops.netlify.app',
              data: { name, role, team },
            },
          });
          if (!otpErr) magicLinkSent = true;
        }
      } catch (authCallErr: any) {
        console.warn('Supabase invite magic link error (falling back to signInWithOtp):', authCallErr?.message);
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: params.redirectTo || 'https://thrill-contentops.netlify.app',
            data: { name, role, team },
          },
        });
        if (!otpErr) magicLinkSent = true;
      }
    } catch (err: any) {
      console.warn('inviteUser error:', err);
    }
  } else {
    // Offline / Demo mode simulation: Magic link is simulated
    magicLinkSent = true;
  }

  // Update in fallback store
  fallbackUserStore.set(resultUser.id, resultUser);
  fallbackUserStore.set(resultUser.email, resultUser);

  return {
    user: resultUser,
    magicLinkSent,
    message: magicLinkSent
      ? `Invitation and Magic Link sent to ${email} with role '${role}'.`
      : `User pre-provisioned in database, but email dispatch was queued.`,
  };
}

/**
 * Super Admin user deletion / revocation
 */
export async function removeUser(id: string): Promise<boolean> {
  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      await supabase.from('profiles').delete().eq('id', id);
    } catch (err) {
      console.warn('removeUser error:', err);
    }
  }

  const user = fallbackUserStore.get(id);
  if (user) {
    fallbackUserStore.delete(id);
    if (user.email) fallbackUserStore.delete(user.email);
    return true;
  }
  return false;
}
