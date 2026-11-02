import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { AssetStatus, ContentAsset, FormatTier, PillarType, Priority, User, UserRole } from '../types';
import { INITIAL_ASSETS, SEED_USERS } from './seedData';

export const SUPABASE_URL_KEY = 'contentops_supabase_url';
export const SUPABASE_ANON_KEY = 'contentops_supabase_anon_key';

// Mock/Default fallback for prototyping when environment variables are not yet injected
const DEFAULT_SUPABASE_URL = 'https://mock-contentops.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'unconfigured';
}

/**
 * Retrieves the active Supabase project configuration from env vars or localStorage
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('mock-contentops')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env'
    };
  }

  try {
    const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const storedKey = localStorage.getItem(SUPABASE_ANON_KEY);
    if (storedUrl && storedKey) {
      return {
        url: storedUrl.trim(),
        anonKey: storedKey.trim(),
        isConfigured: true,
        source: 'storage'
      };
    }
  } catch {
    // ignore
  }

  return {
    url: envUrl || DEFAULT_SUPABASE_URL,
    anonKey: envKey || DEFAULT_SUPABASE_ANON_KEY,
    isConfigured: Boolean(envUrl && envKey),
    source: 'unconfigured'
  };
}

/**
 * Saves custom Supabase project credentials to browser storage
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
    _cachedClient = null; // Invalidate cached instance
  } catch {
    // ignore
  }
}

/**
 * Clears custom stored Supabase credentials
 */
export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
    _cachedClient = null;
  } catch {
    // ignore
  }
}

let _cachedClient: SupabaseClient | null = null;

/**
 * Returns the initialized Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient {
  if (_cachedClient) return _cachedClient;

  const config = getSupabaseConfig();
  _cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return _cachedClient;
}

/**
 * Maps a Supabase Auth User object to the ContentOps User model
 */
export function mapSupabaseUserToUser(
  sbUser: Pick<SupabaseUser, 'id' | 'email' | 'user_metadata'>,
  fallbackRole: UserRole = 'CONTENT_MANAGER'
): User {
  const metadata = sbUser.user_metadata || {};
  const email = (sbUser.email || 'operator@thrill.ai').trim().toLowerCase();
  const isDesignatedSuperAdmin =
    email === 'previewsites40@gmail.com' ||
    email === 'elena@thrill.com' ||
    email === 'admin@thrill.com' ||
    email === 'superadmin@thrill.com';

  const name =
    metadata.full_name ||
    metadata.name ||
    email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'ContentOps Operator';

  const role: UserRole = isDesignatedSuperAdmin
    ? 'SUPER_ADMIN'
    : metadata.role && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'CREATIVE_SPECIALIST', 'STAKEHOLDER', 'DISTRIBUTION_LEAD'].includes(metadata.role)
      ? metadata.role
      : fallbackRole;

  return {
    id: sbUser.id,
    name,
    email,
    role,
    avatarUrl:
      metadata.avatar_url ||
      metadata.picture ||
      `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80`,
    department: metadata.department || 'Enterprise ContentOps & Growth',
    team: metadata.team || metadata.department || 'Executive ContentOps Pod'
  };
}

/**
 * Database Row interface for 'content_assets' table in Supabase
 */
export interface ContentAssetDbRow {
  id: string;
  title: string;
  description: string | null;
  pillar: string;
  format_tier: string;
  status: string;
  priority: string;
  parent_id: string | null;
  parent_title: string | null;
  hook_strategy: string | null;
  target_audience: string | null;
  platform_specs: string | null;
  safe_zone_requirements: string | null;
  target_kpi: string | null;
  raw_intake_notes: string | null;
  sla_hours: number;
  sla_started_at: string | null;
  sla_expires_at: string | null;
  is_sla_breached: boolean;
  qa_tone_approved: boolean;
  qa_specs_validated: boolean;
  qa_rights_cleared: boolean;
  qa_gatekeeper_signed: boolean;
  qa_signed_by_id: string | null;
  qa_signed_by_name: string | null;
  qa_signed_at: string | null;
  deliverable_url: string | null;
  attachment_count: number;
  thumbnail_url: string | null;
  retention_rate_3s: number | null;
  reach_impressions: string | null;
  is_winning_format: boolean;
  paid_eligible: boolean;
  sent_to_paid_ads: boolean;
  created_by_id: string;
  assigned_to_id: string | null;
  target_publish_at: string | null;
  history: any | null;
  generated_hooks: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Converts camelCase ContentAsset model to snake_case PostgreSQL row
 */
export function mapAssetToDbRow(asset: ContentAsset): ContentAssetDbRow {
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description ?? null,
    pillar: asset.pillar,
    format_tier: asset.formatTier,
    status: asset.status,
    priority: asset.priority,
    parent_id: asset.parentId ?? null,
    parent_title: asset.parentTitle ?? null,
    hook_strategy: asset.hookStrategy ?? null,
    target_audience: asset.targetAudience ?? null,
    platform_specs: asset.platformSpecs ?? null,
    safe_zone_requirements: asset.safeZoneRequirements ?? null,
    target_kpi: asset.targetKpi ?? null,
    raw_intake_notes: asset.rawIntakeNotes ?? null,
    sla_hours: asset.slaHours || 48,
    sla_started_at: asset.slaStartedAt ?? null,
    sla_expires_at: asset.slaExpiresAt ?? null,
    is_sla_breached: Boolean(asset.isSlaBreached),
    qa_tone_approved: Boolean(asset.qaToneApproved),
    qa_specs_validated: Boolean(asset.qaSpecsValidated),
    qa_rights_cleared: Boolean(asset.qaRightsCleared),
    qa_gatekeeper_signed: Boolean(asset.qaGatekeeperSigned),
    qa_signed_by_id: asset.qaSignedById ?? null,
    qa_signed_by_name: asset.qaSignedByName ?? null,
    qa_signed_at: asset.qaSignedAt ?? null,
    deliverable_url: asset.deliverableUrl ?? null,
    attachment_count: asset.attachmentCount ?? 0,
    thumbnail_url: asset.thumbnailUrl ?? null,
    retention_rate_3s: asset.retentionRate3s ?? null,
    reach_impressions: asset.reachImpressions ?? null,
    is_winning_format: Boolean(asset.isWinningFormat),
    paid_eligible: Boolean(asset.paidEligible),
    sent_to_paid_ads: Boolean(asset.sentToPaidAds),
    created_by_id: asset.createdById,
    assigned_to_id: asset.assignedToId ?? null,
    target_publish_at: asset.targetPublishAt ?? null,
    history: asset.history ?? null,
    generated_hooks: asset.generatedHooks ?? null,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt
  };
}

/**
 * Converts snake_case PostgreSQL row to camelCase ContentAsset model
 */
export function mapDbRowToAsset(row: ContentAssetDbRow): ContentAsset {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    pillar: row.pillar as PillarType,
    formatTier: row.format_tier as FormatTier,
    status: row.status as AssetStatus,
    priority: row.priority as Priority,
    parentId: row.parent_id,
    parentTitle: row.parent_title || undefined,
    hookStrategy: row.hook_strategy || undefined,
    targetAudience: row.target_audience || undefined,
    platformSpecs: row.platform_specs || undefined,
    safeZoneRequirements: row.safe_zone_requirements || undefined,
    targetKpi: row.target_kpi || undefined,
    rawIntakeNotes: row.raw_intake_notes || undefined,
    slaHours: row.sla_hours,
    slaStartedAt: row.sla_started_at,
    slaExpiresAt: row.sla_expires_at,
    isSlaBreached: row.is_sla_breached,
    qaToneApproved: row.qa_tone_approved,
    qaSpecsValidated: row.qa_specs_validated,
    qaRightsCleared: row.qa_rights_cleared,
    qaGatekeeperSigned: row.qa_gatekeeper_signed,
    qaSignedById: row.qa_signed_by_id,
    qaSignedByName: row.qa_signed_by_name,
    qaSignedAt: row.qa_signed_at,
    deliverableUrl: row.deliverable_url,
    attachmentCount: row.attachment_count,
    thumbnailUrl: row.thumbnail_url,
    retentionRate3s: row.retention_rate_3s,
    reachImpressions: row.reach_impressions,
    isWinningFormat: row.is_winning_format,
    paidEligible: row.paid_eligible,
    sentToPaidAds: row.sent_to_paid_ads,
    createdById: row.created_by_id,
    assignedToId: row.assigned_to_id,
    targetPublishAt: row.target_publish_at,
    history: Array.isArray(row.history) ? row.history : undefined,
    generatedHooks: Array.isArray(row.generated_hooks) ? row.generated_hooks : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Fetch all content assets from Supabase
 */
export async function fetchAssetsFromSupabase(): Promise<ContentAsset[] | null> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('content_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch assets error:', error.message);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map((row) => mapDbRowToAsset(row as ContentAssetDbRow));
    }
    return [];
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Upserts a single content asset to Supabase
 */
export async function upsertAssetToSupabase(asset: ContentAsset): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return false;

  try {
    const supabase = getSupabaseClient();
    const row = mapAssetToDbRow(asset);
    const { error } = await supabase.from('content_assets').upsert(row);

    if (error) {
      console.warn('Supabase upsert asset error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert exception:', err);
    return false;
  }
}

/**
 * Deletes an asset by ID from Supabase
 */
export async function deleteAssetFromSupabase(assetId: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return false;

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('content_assets').delete().eq('id', assetId);
    if (error) {
      console.warn('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete exception:', err);
    return false;
  }
}

/**
 * Seeds initial assets into Supabase if table is empty
 */
export async function seedAssetsToSupabaseIfEmpty(initialAssets: ContentAsset[] = INITIAL_ASSETS): Promise<void> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return;

  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('content_assets')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === 0 || count === null)) {
      const rows = initialAssets.map(mapAssetToDbRow);
      await supabase.from('content_assets').upsert(rows);
    }
  } catch (err) {
    console.warn('Supabase seed check error:', err);
  }
}

/**
 * Supabase Auth: Sign in with Email and Password
 */
export async function supabaseSignInWithPassword(email: string, password: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  if (data.user) {
    return mapSupabaseUserToUser(data.user);
  }
  return null;
}

/**
 * Supabase Auth: Sign up with Email and Password
 */
export async function supabaseSignUp(
  email: string,
  password: string,
  metadata?: { name?: string; role?: UserRole; team?: string; avatarUrl?: string }
): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: metadata?.name || email.split('@')[0],
        role: metadata?.role || 'CONTENT_MANAGER',
        team: metadata?.team || 'Executive ContentOps Pod',
        avatar_url: metadata?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    const mapped = mapSupabaseUserToUser(data.user);
    if (metadata?.team) mapped.team = metadata.team;
    if (metadata?.avatarUrl) mapped.avatarUrl = metadata.avatarUrl;
    // Attempt non-blocking profile sync to profiles table
    syncUserProfileToSupabase(mapped).catch((syncErr) => {
      console.warn('Initial profile sync note:', syncErr);
    });
    return mapped;
  }
  return null;
}

/**
 * Supabase Auth: Send Passwordless Magic Link / OTP to email
 */
export async function supabaseSignInWithOtp(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

/**
 * Supabase Auth: Sign in with OAuth provider (Google)
 */
export async function supabaseSignInWithOAuth(provider: 'google' | 'github'): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Supabase Auth: Sign out
 */
export async function supabaseSignOut(): Promise<void> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return;
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase sign out error:', err);
  }
}

/**
 * Database Row interface for the 'profiles' table in Supabase
 */
export interface ProfileDbRow {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  avatar_url: string | null;
  team: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Syncs user profile metadata (avatar URL, role, team) from application settings directly
 * to the 'profiles' table in Supabase and the Supabase Auth user metadata.
 */
export async function syncUserProfileToSupabase(profile: {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  team?: string;
  department?: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig();
  const nowIso = new Date().toISOString();

  // If Supabase is unconfigured, return success for local-first operations
  if (!config.isConfigured) {
    return { success: true };
  }

  try {
    const supabase = getSupabaseClient();

    const profilePayload: ProfileDbRow = {
      id: profile.id,
      email: profile.email || null,
      name: profile.name || null,
      role: profile.role,
      avatar_url: profile.avatarUrl || null,
      team: profile.team || profile.department || 'Executive ContentOps Pod',
      updated_at: nowIso
    };

    // 1. Sync directly to the 'profiles' table in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.warn('Supabase profiles table upsert warning:', profileError.message);
      // Secondary fallback to user_profiles if schema has not yet migrated
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            id: profile.id,
            email: profile.email || 'operator@thrill.ai',
            name: profile.name,
            role: profile.role,
            avatar_url: profile.avatarUrl,
            department: profile.team || profile.department,
            updated_at: nowIso
          }, { onConflict: 'id' });
      } catch {
        // ignore fallback failure
      }
    }

    // 2. Sync custom user metadata in Supabase Auth if currently signed-in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === profile.id) {
        await supabase.auth.updateUser({
          data: {
            name: profile.name,
            full_name: profile.name,
            avatar_url: profile.avatarUrl,
            role: profile.role,
            team: profile.team || profile.department
          }
        });
      }
    } catch (authErr) {
      console.warn('Supabase auth metadata update notice:', authErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to sync profile to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to sync profile to Supabase' };
  }
}

/**
 * Fetches user profile directly from the 'profiles' table in Supabase
 */
export async function fetchUserProfileFromSupabase(userId: string): Promise<Partial<User> | null> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      // Check legacy table
      const { data: legacyData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (legacyData) {
        return {
          id: legacyData.id,
          name: legacyData.name,
          email: legacyData.email,
          role: legacyData.role,
          avatarUrl: legacyData.avatar_url,
          team: legacyData.department
        };
      }
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url,
      team: data.team
    };
  } catch (err) {
    console.warn('Failed to fetch user profile from Supabase:', err);
    return null;
  }
}

