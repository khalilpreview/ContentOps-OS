import { getServerSupabaseClient, getServerSupabaseConfig } from '../serverSupabase';
import type { AssetActivity } from './types';

// In-memory fallback for offline or tests
const inMemoryActivities: AssetActivity[] = [];

/**
 * Records an immutable audit log entry for an asset action.
 */
export async function logAssetActivity(activity: Omit<AssetActivity, 'id' | 'createdAt'>): Promise<AssetActivity> {
  const fullActivity: AssetActivity = {
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { error } = await supabase.from('asset_activities').insert({
        id: fullActivity.id,
        asset_id: fullActivity.assetId,
        performed_by: fullActivity.performedBy,
        performer_name: fullActivity.performerName,
        performer_role: fullActivity.performerRole,
        action: fullActivity.action,
        previous_stage: fullActivity.previousStage,
        new_stage: fullActivity.newStage,
        reason: fullActivity.reason,
        metadata: fullActivity.metadata || {},
        created_at: fullActivity.createdAt,
      });

      if (error) {
        console.warn('[AuditLogger] Supabase insert warning (falling back to memory):', error.message);
        inMemoryActivities.push(fullActivity);
      }
    } catch (err: any) {
      console.warn('[AuditLogger] Supabase insert error:', err.message);
      inMemoryActivities.push(fullActivity);
    }
  } else {
    inMemoryActivities.push(fullActivity);
  }

  return fullActivity;
}

/**
 * Retrieves chronological audit history for an asset.
 */
export async function getAssetActivities(assetId: string): Promise<AssetActivity[]> {
  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { data, error } = await supabase
        .from('asset_activities')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          assetId: d.asset_id,
          performedBy: d.performed_by,
          performerName: d.performer_name,
          performerRole: d.performer_role,
          action: d.action,
          previousStage: d.previous_stage,
          newStage: d.new_stage,
          reason: d.reason,
          metadata: d.metadata || {},
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      // Fallback to inMemoryActivities
    }
  }

  return inMemoryActivities
    .filter((a) => a.assetId === assetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Clear activities (useful for test runs)
 */
export function clearInMemoryActivities(): void {
  inMemoryActivities.length = 0;
}
