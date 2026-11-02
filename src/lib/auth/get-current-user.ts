import type { Request } from 'express';
import { getServerSupabaseClient, getServerSupabaseConfig } from '../serverSupabase';
import { syncUser, getUserById } from './sync-user';
import { UnauthorizedError } from './types';
import type { User } from './types';
import { SEED_USERS } from '../seedData';

/**
 * Extracts bearer token or cookie from request.
 */
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check cookies if cookie-parser is enabled
  const cookies = (req as any).cookies;
  if (cookies && cookies['sb-access-token']) {
    return cookies['sb-access-token'];
  }

  // Check custom header for demo/impersonation in local development
  const devUserId = req.headers['x-dev-user-id'] || req.headers['x-thrill-user-id'];
  if (typeof devUserId === 'string' && devUserId.trim()) {
    return `dev:${devUserId.trim()}`;
  }

  return null;
}

/**
 * Validates request session and resolves the authenticated User record from database/cache.
 * Throws UnauthorizedError if token is missing or invalid.
 */
export async function getCurrentUser(req: Request): Promise<User> {
  const token = extractAuthToken(req);

  if (!token) {
    throw new UnauthorizedError('Authentication required: Missing Bearer token or session');
  }

  // Development/offline impersonation token support
  if (token.startsWith('dev:')) {
    const userIdOrEmail = token.substring(4);
    // Try by ID first
    let local = getUserById(userIdOrEmail);
    if (!local) {
      // Try seed users
      const seed = SEED_USERS.find(
        (u) => u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
      );
      if (seed) {
        local = await syncUser({
          id: seed.id,
          email: seed.email,
          user_metadata: {
            name: seed.name,
            avatar_url: seed.avatarUrl,
            role: seed.role,
          },
        });
      }
    }

    if (local) {
      return local;
    }
    throw new UnauthorizedError(`Dev user '${userIdOrEmail}' not found`);
  }

  const config = getServerSupabaseConfig();
  if (!config.isConfigured) {
    // If Supabase is not configured, fallback to checking local storage / seed users
    const seed = SEED_USERS[0];
    return {
      id: seed.id,
      name: seed.name,
      email: seed.email,
      role: seed.role,
      avatarUrl: seed.avatarUrl,
    };
  }

  try {
    const supabase = getServerSupabaseClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }

    // Resolve user and role from database
    const user = await syncUser({
      id: authUser.id,
      email: authUser.email || '',
      user_metadata: {
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatar_url: authUser.user_metadata?.avatar_url,
      },
    });

    return user;
  } catch (err: any) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError(err.message || 'Authentication failed');
  }
}
