import { getSupabaseClient } from './supabase';
import type { AssetStatus, ContentAsset } from '../types';
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
