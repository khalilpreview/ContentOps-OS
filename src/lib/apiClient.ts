import { getSupabaseClient } from './supabase';
import type { AssetStatus, ContentAsset, User } from '../types';
import type { AssetActivity } from './audit/types';

/**
 * Get the active auth token (Supabase session or local dev user)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch (err) {
    // Session retrieval error fallback
  }

  // Fallback to active impersonated user in localStorage
  const activeUser = localStorage.getItem('thrill_active_user');
  if (activeUser) {
    try {
      const parsed = JSON.parse(activeUser);
      if (parsed.id) {
        headers['x-dev-user-id'] = parsed.id;
      }
    } catch {
      // ignore
    }
  }

  return headers;
}

/**
 * Call server-side transition endpoint
 */
export async function serverTransitionAsset(payload: {
  assetId: string;
  targetStage: AssetStatus;
  reason?: string;
  metadata?: any;
}): Promise<{ success: boolean; asset: ContentAsset }> {
  const headers = await getAuthHeaders();

  // Try Express endpoint first, fallback to Netlify function if in production
  const endpoints = ['/api/assets/transition', '/.netlify/functions/transition'];

  let lastErr = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 404 && url === endpoints[0]) {
        continue; // Try netlify functions
      }

      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || errBody.error || `Transition failed (${res.status})`);
    } catch (err: any) {
      lastErr = err;
      if (url === endpoints[0]) continue;
      throw err;
    }
  }

  throw lastErr || new Error('Network error calling transition endpoint');
}

/**
 * Fetch asset activities/audit history from server
 */
export async function fetchAssetActivities(assetId: string): Promise<AssetActivity[]> {
  const headers = await getAuthHeaders();
  const endpoints = [
    `/api/assets/${assetId}/activities`,
    `/.netlify/functions/activities?assetId=${assetId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.activities || [];
      }
    } catch (err) {
      // Continue to next endpoint
    }
  }

  return [];
}

/**
 * Fetch all users from Super Admin endpoint
 */
export async function fetchAdminUsers(): Promise<User[]> {
  const headers = await getAuthHeaders();
  const endpoints = ['/api/admin/users', '/.netlify/functions/admin-users'];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
    } catch {
      // Continue
    }
  }
  return [];
}

/**
 * Super Admin invite user & dispatch magic link
 */
export async function inviteAdminUser(payload: {
  email: string;
  name?: string;
  role: string;
  team?: string;
}): Promise<{ user: User; magicLinkSent: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const endpoints = ['/api/admin/invite-user', '/.netlify/functions/admin-users'];

  const body = {
    ...payload,
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
  };

  let lastErr = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        return await res.json();
      }

      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || errBody.error || `Invite failed (${res.status})`);
    } catch (err) {
      lastErr = err;
      if (url === endpoints[0]) continue;
      throw err;
    }
  }

  throw lastErr || new Error('Network error calling invite endpoint');
}

/**
 * Super Admin update user role
 */
export async function updateAdminUserRole(id: string, role: string): Promise<User | null> {
  const headers = await getAuthHeaders();
  const endpoints = [`/api/admin/users/${id}`, `/.netlify/functions/admin-users`];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.user || null;
      }
    } catch {
      // Continue
    }
  }
  return null;
}

/**
 * Super Admin remove user
 */
export async function deleteAdminUser(id: string): Promise<boolean> {
  const headers = await getAuthHeaders();
  const endpoints = [`/api/admin/users/${id}`, `/.netlify/functions/admin-users?id=${id}`];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.success);
      }
    } catch {
      // Continue
    }
  }
  return false;
}
