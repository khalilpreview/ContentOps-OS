import { getServerSupabaseClient, getServerSupabaseConfig } from '../serverSupabase';
import { User, UserRole } from './types';
import { SEED_USERS } from '../seedData';

// Designated emails automatically promoted to CONTENT_MANAGER
export const DESIGNATED_CONTENT_MANAGERS = [
  'elena@thrill.com',
  'content.manager@thrill.com',
  'admin@thrill.com',
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
 * (or 'CONTENT_MANAGER' if email is designated).
 */
export async function syncUser(authUser: AuthUserInput): Promise<User> {
  const email = (authUser.email || '').trim().toLowerCase();
  const id = authUser.id;
  const isDesignatedAdmin = DESIGNATED_CONTENT_MANAGERS.includes(email);
  const metadata = authUser.user_metadata || {};

  const name =
    metadata.name ||
    (email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'ContentOps Operator');
  const formattedName = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const resolvedRole: UserRole = isDesignatedAdmin
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
  } else if (isDesignatedAdmin && local.role !== 'CONTENT_MANAGER') {
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
