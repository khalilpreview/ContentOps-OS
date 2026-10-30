import {
  AssetStatus,
  AuthSession,
  ContentAsset,
  FormatTier,
  HookVariation,
  PillarType,
  Priority,
  User,
  UserRole
} from '../types';
import { AiConfig } from './aiService';
import { INITIAL_ASSETS, SEED_USERS } from './seedData';

export const ASSETS_STORAGE_KEY = 'contentops_assets_data_v2';
export const LEGACY_ASSETS_KEYS = ['contentops_assets_data', 'contentops_assets_data_v1'];
export const USER_STORAGE_KEY = 'contentops_active_user';
export const AUTH_STORAGE_KEY = 'contentops_auth_session';
export const AI_CONFIG_STORAGE_KEY = 'contentops_ai_config';
export const SEARCH_HISTORY_STORAGE_KEY = 'contentops_search_history';
export const MAX_SEARCH_HISTORY_ITEMS = 5;

const VALID_PILLARS: PillarType[] = [
  'STRATEGY_SERIES',
  'CONTENT_OPS',
  'CROSS_FUNCTIONAL',
  'BRAND_QA',
  'INTELLIGENCE_OPTIMIZATION'
];

const VALID_TIERS: FormatTier[] = ['HERO', 'HUB', 'HYGIENE'];

const VALID_STATUSES: AssetStatus[] = [
  'DRAFT_BRIEF',
  'SLA_REVIEW',
  'IN_PRODUCTION',
  'QA_GATE',
  'READY_TO_PUBLISH',
  'PUBLISHED'
];

const VALID_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const VALID_ROLES: UserRole[] = [
  'CONTENT_MANAGER',
  'CREATIVE_SPECIALIST',
  'STAKEHOLDER',
  'DISTRIBUTION_LEAD'
];

const VALID_PROVIDERS: Array<AuthSession['provider']> = ['google', 'email', 'sso'];

export interface StorageMigrationReport {
  hadDiscrepancies: boolean;
  repairedKeys: string[];
  repairedAssetCount: number;
  migratedFromLegacyKey: boolean;
  summaryMessages: string[];
  timestamp: string;
}

export interface ValidatedStorageState {
  assets: ContentAsset[];
  currentUser: User;
  authSession: AuthSession | null;
  aiConfig: AiConfig;
  report: StorageMigrationReport;
}

function isValidIsoDate(val: unknown): val is string {
  if (typeof val !== 'string' || val.trim() === '') return false;
  const time = Date.parse(val);
  return !Number.isNaN(time);
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Validates and repairs a single ContentAsset record in-place,
 * preserving all valid user edits while backfilling missing or corrupted fields.
 */
export function validateAndRepairAsset(
  raw: unknown,
  index: number
): { asset: ContentAsset; fixes: string[] } {
  const fixes: string[] = [];
  const nowIso = new Date().toISOString();

  if (!isObject(raw)) {
    const fallback = INITIAL_ASSETS[index % INITIAL_ASSETS.length] || INITIAL_ASSETS[0];
    return {
      asset: { ...fallback, id: `asset-recovered-${Date.now()}-${index}` },
      fixes: [`Replaced non-object asset record at index ${index} with baseline template`]
    };
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim() !== ''
      ? raw.id.trim()
      : `asset-repaired-${Date.now()}-${index}`;
  if (id !== raw.id) {
    fixes.push(`Generated missing asset ID (${id})`);
  }

  // Match seed asset if available for smart default backfilling
  const seedMatch = INITIAL_ASSETS.find((a) => a.id === id);

  const title =
    typeof raw.title === 'string' && raw.title.trim() !== ''
      ? raw.title
      : seedMatch?.title || 'Untitled Content Asset';
  if (title !== raw.title) {
    fixes.push(`Restored missing title on "${id}"`);
  }

  const pillar: PillarType = VALID_PILLARS.includes(raw.pillar as PillarType)
    ? (raw.pillar as PillarType)
    : seedMatch?.pillar || 'CONTENT_OPS';
  if (pillar !== raw.pillar) {
    fixes.push(`Normalized invalid pillar on "${title}" to ${pillar}`);
  }

  const formatTier: FormatTier = VALID_TIERS.includes(raw.formatTier as FormatTier)
    ? (raw.formatTier as FormatTier)
    : seedMatch?.formatTier || 'HUB';
  if (formatTier !== raw.formatTier) {
    fixes.push(`Normalized invalid formatTier on "${title}" to ${formatTier}`);
  }

  const status: AssetStatus = VALID_STATUSES.includes(raw.status as AssetStatus)
    ? (raw.status as AssetStatus)
    : seedMatch?.status || 'DRAFT_BRIEF';
  if (status !== raw.status) {
    fixes.push(`Normalized invalid status on "${title}" to ${status}`);
  }

  const priority: Priority = VALID_PRIORITIES.includes(raw.priority as Priority)
    ? (raw.priority as Priority)
    : seedMatch?.priority || 'MEDIUM';
  if (priority !== raw.priority) {
    fixes.push(`Normalized invalid priority on "${title}" to ${priority}`);
  }

  // SLA fields
  const slaHours =
    typeof raw.slaHours === 'number' && Number.isFinite(raw.slaHours) && raw.slaHours > 0
      ? raw.slaHours
      : seedMatch?.slaHours || 48;
  if (slaHours !== raw.slaHours) {
    fixes.push(`Repaired slaHours on "${title}" (${slaHours}h)`);
  }

  let slaStartedAt =
    raw.slaStartedAt === null || raw.slaStartedAt === undefined
      ? null
      : isValidIsoDate(raw.slaStartedAt)
      ? raw.slaStartedAt
      : seedMatch?.slaStartedAt || null;

  let slaExpiresAt =
    raw.slaExpiresAt === null || raw.slaExpiresAt === undefined
      ? null
      : isValidIsoDate(raw.slaExpiresAt)
      ? raw.slaExpiresAt
      : seedMatch?.slaExpiresAt || null;

  if (status === 'SLA_REVIEW' && (!slaStartedAt || !slaExpiresAt)) {
    const startMs = Date.now();
    slaStartedAt = slaStartedAt || new Date(startMs).toISOString();
    slaExpiresAt =
      slaExpiresAt || new Date(startMs + slaHours * 3600000).toISOString();
    fixes.push(`Synthesized missing SLA review window timestamps on "${title}"`);
  }

  const isSlaBreached =
    typeof raw.isSlaBreached === 'boolean'
      ? raw.isSlaBreached
      : Boolean(slaExpiresAt && Date.parse(slaExpiresAt) < Date.now());
  if (typeof raw.isSlaBreached !== 'boolean') {
    fixes.push(`Repaired boolean isSlaBreached flag on "${title}"`);
  }

  // QA Gatekeeper 4-point checklist
  let qaToneApproved =
    typeof raw.qaToneApproved === 'boolean'
      ? raw.qaToneApproved
      : seedMatch?.qaToneApproved ?? false;
  let qaSpecsValidated =
    typeof raw.qaSpecsValidated === 'boolean'
      ? raw.qaSpecsValidated
      : seedMatch?.qaSpecsValidated ?? false;
  let qaRightsCleared =
    typeof raw.qaRightsCleared === 'boolean'
      ? raw.qaRightsCleared
      : seedMatch?.qaRightsCleared ?? false;
  let qaGatekeeperSigned =
    typeof raw.qaGatekeeperSigned === 'boolean'
      ? raw.qaGatekeeperSigned
      : seedMatch?.qaGatekeeperSigned ?? false;

  if (
    typeof raw.qaToneApproved !== 'boolean' ||
    typeof raw.qaSpecsValidated !== 'boolean' ||
    typeof raw.qaRightsCleared !== 'boolean' ||
    typeof raw.qaGatekeeperSigned !== 'boolean'
  ) {
    fixes.push(`Backfilled missing QA 4-point checklist booleans on "${title}"`);
  }

  // RACI Invariant: Assets in READY_TO_PUBLISH or PUBLISHED must have all 4 QA checks true
  if (
    (status === 'READY_TO_PUBLISH' || status === 'PUBLISHED') &&
    (!qaToneApproved || !qaSpecsValidated || !qaRightsCleared || !qaGatekeeperSigned)
  ) {
    qaToneApproved = true;
    qaSpecsValidated = true;
    qaRightsCleared = true;
    qaGatekeeperSigned = true;
    fixes.push(`Enforced 4-point QA Gatekeeper invariant for ${status} asset "${title}"`);
  }

  // Phase 5 Feedback loop fields
  const retentionRate3s =
    typeof raw.retentionRate3s === 'number' && Number.isFinite(raw.retentionRate3s)
      ? Math.max(0, Math.min(100, raw.retentionRate3s))
      : raw.retentionRate3s === null || raw.retentionRate3s === undefined
      ? null
      : seedMatch?.retentionRate3s ?? null;

  const isWinningFormat =
    typeof raw.isWinningFormat === 'boolean'
      ? raw.isWinningFormat
      : typeof retentionRate3s === 'number'
      ? retentionRate3s > 65
      : seedMatch?.isWinningFormat ?? false;

  const paidEligible =
    typeof raw.paidEligible === 'boolean'
      ? raw.paidEligible
      : isWinningFormat || (seedMatch?.paidEligible ?? false);

  if (typeof raw.isWinningFormat !== 'boolean' || typeof raw.paidEligible !== 'boolean') {
    fixes.push(`Repaired post-launch performance flags on "${title}"`);
  }

  // Ownership & dates
  const createdById =
    typeof raw.createdById === 'string' && raw.createdById.trim() !== ''
      ? raw.createdById
      : seedMatch?.createdById || SEED_USERS[0].id;
  if (createdById !== raw.createdById) {
    fixes.push(`Repaired missing createdById on "${title}"`);
  }

  const createdAt = isValidIsoDate(raw.createdAt)
    ? raw.createdAt
    : seedMatch?.createdAt || nowIso;
  const updatedAt = isValidIsoDate(raw.updatedAt)
    ? raw.updatedAt
    : seedMatch?.updatedAt || nowIso;

  if (createdAt !== raw.createdAt || updatedAt !== raw.updatedAt) {
    fixes.push(`Normalized ISO timestamps (createdAt/updatedAt) on "${title}"`);
  }

  // Validate optional generatedHooks array
  let generatedHooks: HookVariation[] | undefined = undefined;
  if (Array.isArray(raw.generatedHooks)) {
    const validHooks = raw.generatedHooks
      .filter((h) => isObject(h) && typeof h.script === 'string')
      .map((h) => ({
        type: typeof h.type === 'string' && h.type.trim() !== '' ? h.type : 'Direct Value',
        script: String(h.script)
      }));
    if (validHooks.length !== raw.generatedHooks.length) {
      fixes.push(`Sanitized malformed generatedHooks entries on "${title}"`);
    }
    generatedHooks = validHooks;
  } else if (raw.generatedHooks !== undefined) {
    fixes.push(`Removed non-array generatedHooks field on "${title}"`);
  }

  // Validate optional history array
  let history: ContentAsset['history'] = undefined;
  if (Array.isArray(raw.history)) {
    history = raw.history
      .filter((item) => isObject(item))
      .map((item, hIdx) => ({
        id: typeof item.id === 'string' ? item.id : `hist-${id}-${hIdx}`,
        action: typeof item.action === 'string' ? item.action : 'Updated asset',
        fromStatus: VALID_STATUSES.includes(item.fromStatus as AssetStatus)
          ? (item.fromStatus as AssetStatus)
          : undefined,
        toStatus: VALID_STATUSES.includes(item.toStatus as AssetStatus)
          ? (item.toStatus as AssetStatus)
          : undefined,
        userId: typeof item.userId === 'string' ? item.userId : createdById,
        userName: typeof item.userName === 'string' ? item.userName : 'Operator',
        timestamp: isValidIsoDate(item.timestamp) ? item.timestamp : updatedAt,
        note: typeof item.note === 'string' ? item.note : undefined
      }));
  }

  const repairedAsset: ContentAsset = {
    id,
    title,
    description: typeof raw.description === 'string' ? raw.description : seedMatch?.description,
    pillar,
    formatTier,
    status,
    priority,
    parentId:
      typeof raw.parentId === 'string' || raw.parentId === null
        ? raw.parentId
        : seedMatch?.parentId ?? null,
    parentTitle: typeof raw.parentTitle === 'string' ? raw.parentTitle : seedMatch?.parentTitle,
    hookStrategy:
      typeof raw.hookStrategy === 'string' ? raw.hookStrategy : seedMatch?.hookStrategy ?? '',
    platformSpecs:
      typeof raw.platformSpecs === 'string' ? raw.platformSpecs : seedMatch?.platformSpecs ?? '',
    targetKpi: typeof raw.targetKpi === 'string' ? raw.targetKpi : seedMatch?.targetKpi ?? '',
    rawIntakeNotes:
      typeof raw.rawIntakeNotes === 'string' ? raw.rawIntakeNotes : seedMatch?.rawIntakeNotes ?? '',
    generatedHooks,
    slaHours,
    slaStartedAt,
    slaExpiresAt,
    isSlaBreached,
    qaToneApproved,
    qaSpecsValidated,
    qaRightsCleared,
    qaGatekeeperSigned,
    qaSignedById:
      typeof raw.qaSignedById === 'string' || raw.qaSignedById === null
        ? raw.qaSignedById
        : qaGatekeeperSigned
        ? SEED_USERS[0].id
        : null,
    qaSignedByName:
      typeof raw.qaSignedByName === 'string' || raw.qaSignedByName === null
        ? raw.qaSignedByName
        : qaGatekeeperSigned
        ? SEED_USERS[0].name
        : null,
    qaSignedAt: isValidIsoDate(raw.qaSignedAt)
      ? raw.qaSignedAt
      : qaGatekeeperSigned
      ? updatedAt
      : null,
    deliverableUrl:
      typeof raw.deliverableUrl === 'string' || raw.deliverableUrl === null
        ? raw.deliverableUrl
        : seedMatch?.deliverableUrl ?? null,
    attachmentCount:
      typeof raw.attachmentCount === 'number' && Number.isFinite(raw.attachmentCount)
        ? Math.max(0, Math.floor(raw.attachmentCount))
        : seedMatch?.attachmentCount ?? 0,
    thumbnailUrl:
      typeof raw.thumbnailUrl === 'string' || raw.thumbnailUrl === null
        ? raw.thumbnailUrl
        : seedMatch?.thumbnailUrl ?? null,
    retentionRate3s,
    reachImpressions:
      typeof raw.reachImpressions === 'string' || raw.reachImpressions === null
        ? raw.reachImpressions
        : seedMatch?.reachImpressions ?? null,
    isWinningFormat,
    paidEligible,
    sentToPaidAds:
      typeof raw.sentToPaidAds === 'boolean'
        ? raw.sentToPaidAds
        : seedMatch?.sentToPaidAds ?? false,
    createdById,
    assignedToId:
      typeof raw.assignedToId === 'string' || raw.assignedToId === null
        ? raw.assignedToId
        : seedMatch?.assignedToId ?? createdById,
    targetPublishAt: isValidIsoDate(raw.targetPublishAt)
      ? raw.targetPublishAt
      : seedMatch?.targetPublishAt ?? null,
    createdAt,
    updatedAt,
    history
  };

  return { asset: repairedAsset, fixes };
}

/**
 * Validates and migrates all localStorage keys used by the application:
 * - contentops_assets_data_v2 (plus legacy keys)
 * - contentops_auth_session
 * - contentops_active_user
 * - contentops_ai_config
 */
export function validateAndMigrateStorage(): ValidatedStorageState {
  const repairedKeys = new Set<string>();
  const summaryMessages: string[] = [];
  let repairedAssetCount = 0;
  let migratedFromLegacyKey = false;

  // 1. Validate & Migrate Assets (contentops_assets_data_v2 + legacy keys)
  let finalAssets: ContentAsset[] = INITIAL_ASSETS;
  try {
    let rawAssetsJson = localStorage.getItem(ASSETS_STORAGE_KEY);

    if (!rawAssetsJson) {
      for (const legacyKey of LEGACY_ASSETS_KEYS) {
        const legacyData = localStorage.getItem(legacyKey);
        if (legacyData) {
          rawAssetsJson = legacyData;
          migratedFromLegacyKey = true;
          localStorage.removeItem(legacyKey);
          repairedKeys.add(ASSETS_STORAGE_KEY);
          summaryMessages.push(
            `Migrated pipeline assets from legacy key "${legacyKey}" to "${ASSETS_STORAGE_KEY}".`
          );
          break;
        }
      }
    }

    if (rawAssetsJson !== null) {
      try {
        const parsed = JSON.parse(rawAssetsJson);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          finalAssets = INITIAL_ASSETS;
          repairedKeys.add(ASSETS_STORAGE_KEY);
          repairedAssetCount = INITIAL_ASSETS.length;
          summaryMessages.push(
            `Restored pipeline asset collection because "${ASSETS_STORAGE_KEY}" was not a valid non-empty array.`
          );
          localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(finalAssets));
        } else {
          const migratedList: ContentAsset[] = [];
          const assetFixNotes: string[] = [];

          parsed.forEach((item, idx) => {
            const { asset, fixes } = validateAndRepairAsset(item, idx);
            migratedList.push(asset);
            if (fixes.length > 0) {
              repairedAssetCount += 1;
              assetFixNotes.push(...fixes);
            }
          });

          finalAssets = migratedList;

          if (assetFixNotes.length > 0 || migratedFromLegacyKey) {
            repairedKeys.add(ASSETS_STORAGE_KEY);
            localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(finalAssets));
            if (assetFixNotes.length > 0) {
              const preview = assetFixNotes.slice(0, 2).join('; ');
              const extra =
                assetFixNotes.length > 2 ? ` (+${assetFixNotes.length - 2} more field repairs)` : '';
              summaryMessages.push(
                `Repaired ${repairedAssetCount} asset record(s) in-place: ${preview}${extra}.`
              );
            }
          }
        }
      } catch {
        finalAssets = INITIAL_ASSETS;
        repairedKeys.add(ASSETS_STORAGE_KEY);
        repairedAssetCount = INITIAL_ASSETS.length;
        summaryMessages.push(
          `Recovered "${ASSETS_STORAGE_KEY}" from corrupted JSON payload using baseline pipeline state.`
        );
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(finalAssets));
      }
    }
  } catch {
    // Fallback if localStorage is blocked
    finalAssets = INITIAL_ASSETS;
  }

  // 2. Validate & Repair Auth Session (contentops_auth_session)
  let validSession: AuthSession | null = null;
  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (rawSession !== null) {
      try {
        const parsed = JSON.parse(rawSession);
        if (!isObject(parsed) || !isObject(parsed.user)) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          repairedKeys.add(AUTH_STORAGE_KEY);
          summaryMessages.push(
            `Cleared malformed authentication session in "${AUTH_STORAGE_KEY}".`
          );
        } else {
          const rawUser = parsed.user as Record<string, unknown>;
          let sessionModified = false;

          const matchedSeed =
            SEED_USERS.find((u) => u.id === rawUser.id) ||
            SEED_USERS.find(
              (u) =>
                typeof rawUser.email === 'string' &&
                u.email.toLowerCase() === rawUser.email.toLowerCase()
            );

          const userId =
            typeof rawUser.id === 'string' && rawUser.id.trim() !== ''
              ? rawUser.id
              : matchedSeed?.id || SEED_USERS[0].id;
          if (userId !== rawUser.id) sessionModified = true;

          const userName =
            typeof rawUser.name === 'string' && rawUser.name.trim() !== ''
              ? rawUser.name
              : matchedSeed?.name || 'ContentOps Operator';
          if (userName !== rawUser.name) sessionModified = true;

          const userEmail =
            typeof rawUser.email === 'string' && rawUser.email.includes('@')
              ? rawUser.email
              : matchedSeed?.email || SEED_USERS[0].email;
          if (userEmail !== rawUser.email) sessionModified = true;

          const userRole: UserRole = VALID_ROLES.includes(rawUser.role as UserRole)
            ? (rawUser.role as UserRole)
            : matchedSeed?.role || 'CONTENT_MANAGER';
          if (userRole !== rawUser.role) sessionModified = true;

          const provider: AuthSession['provider'] = VALID_PROVIDERS.includes(
            parsed.provider as AuthSession['provider']
          )
            ? (parsed.provider as AuthSession['provider'])
            : 'email';
          if (provider !== parsed.provider) sessionModified = true;

          const loginAt = isValidIsoDate(parsed.loginAt)
            ? parsed.loginAt
            : new Date().toISOString();
          if (loginAt !== parsed.loginAt) sessionModified = true;

          validSession = {
            user: {
              id: userId,
              name: userName,
              email: userEmail,
              role: userRole,
              avatarUrl:
                typeof rawUser.avatarUrl === 'string'
                  ? rawUser.avatarUrl
                  : matchedSeed?.avatarUrl,
              department:
                typeof rawUser.department === 'string'
                  ? rawUser.department
                  : matchedSeed?.department || 'Global Content & Brand Operations'
            },
            token: typeof parsed.token === 'string' ? parsed.token : `repaired-token-${Date.now()}`,
            provider,
            loginAt
          };

          if (sessionModified) {
            repairedKeys.add(AUTH_STORAGE_KEY);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validSession));
            summaryMessages.push(
              `Repaired missing or invalid session attributes in "${AUTH_STORAGE_KEY}" while preserving operator identity.`
            );
          }
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        repairedKeys.add(AUTH_STORAGE_KEY);
        summaryMessages.push(`Removed corrupted JSON from "${AUTH_STORAGE_KEY}".`);
      }
    }
  } catch {
    validSession = null;
  }

  // 3. Validate & Repair Active Operator Key (contentops_active_user)
  let resolvedUser: User = validSession?.user || SEED_USERS[0];
  try {
    const rawUserId = localStorage.getItem(USER_STORAGE_KEY);
    if (rawUserId !== null) {
      const trimmedId = rawUserId.trim();
      const matchedSeedUser = SEED_USERS.find((u) => u.id === trimmedId);
      const matchesSessionUser = validSession?.user?.id === trimmedId;

      if (matchedSeedUser) {
        resolvedUser = matchedSeedUser;
      } else if (matchesSessionUser && validSession) {
        resolvedUser = validSession.user;
      } else {
        // Invalid or orphaned user ID in storage -> repair in-place
        const fallbackUser = validSession?.user || SEED_USERS[0];
        resolvedUser = fallbackUser;
        localStorage.setItem(USER_STORAGE_KEY, fallbackUser.id);
        repairedKeys.add(USER_STORAGE_KEY);
        summaryMessages.push(
          `Repaired unrecognized operator ID "${rawUserId}" in "${USER_STORAGE_KEY}" to "${fallbackUser.name}" (${fallbackUser.id}).`
        );
      }
    }
  } catch {
    resolvedUser = validSession?.user || SEED_USERS[0];
  }

  // 4. Validate & Repair AI Engine Configuration (contentops_ai_config)
  const defaultAiConfig: AiConfig = {
    apiKey: (import.meta as any).env?.VITE_IFM_API_KEY || '',
    baseUrl: (import.meta as any).env?.VITE_IFM_BASE_URL || 'https://api.ifm.ai/v1',
    model: (import.meta as any).env?.VITE_IFM_MODEL || 'k2-horizon'
  };
  let resolvedAiConfig: AiConfig = defaultAiConfig;

  try {
    const rawAiConfig = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (rawAiConfig !== null) {
      try {
        const parsed = JSON.parse(rawAiConfig);
        if (!isObject(parsed)) {
          resolvedAiConfig = defaultAiConfig;
          localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(resolvedAiConfig));
          repairedKeys.add(AI_CONFIG_STORAGE_KEY);
          summaryMessages.push(
            `Reset non-object AI configuration in "${AI_CONFIG_STORAGE_KEY}" to default K2 Horizon endpoints.`
          );
        } else {
          let configModified = false;
          const apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : defaultAiConfig.apiKey;
          if (typeof parsed.apiKey !== 'string') configModified = true;

          const baseUrl =
            typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim() !== ''
              ? parsed.baseUrl.trim()
              : defaultAiConfig.baseUrl;
          if (typeof parsed.baseUrl !== 'string' || parsed.baseUrl.trim() === '') {
            configModified = true;
          }

          const model =
            typeof parsed.model === 'string' && parsed.model.trim() !== ''
              ? parsed.model.trim()
              : defaultAiConfig.model;
          if (typeof parsed.model !== 'string' || parsed.model.trim() === '') {
            configModified = true;
          }

          resolvedAiConfig = { apiKey, baseUrl, model };

          if (configModified) {
            localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(resolvedAiConfig));
            repairedKeys.add(AI_CONFIG_STORAGE_KEY);
            summaryMessages.push(
              `Backfilled missing endpoint/model fields in "${AI_CONFIG_STORAGE_KEY}" while keeping stored API credentials.`
            );
          }
        }
      } catch {
        resolvedAiConfig = defaultAiConfig;
        localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(resolvedAiConfig));
        repairedKeys.add(AI_CONFIG_STORAGE_KEY);
        summaryMessages.push(
          `Repaired corrupted JSON in "${AI_CONFIG_STORAGE_KEY}" with default K2 Horizon configuration.`
        );
      }
    }
  } catch {
    resolvedAiConfig = defaultAiConfig;
  }

  // 5. Validate & Repair Search History (contentops_search_history)
  try {
    const rawHistory = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (rawHistory !== null) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (!Array.isArray(parsed)) {
          localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify([]));
          repairedKeys.add(SEARCH_HISTORY_STORAGE_KEY);
          summaryMessages.push(
            `Reset non-array search history in "${SEARCH_HISTORY_STORAGE_KEY}".`
          );
        } else {
          const seen = new Set<string>();
          const sanitized: string[] = [];
          let modified = false;

          for (const item of parsed) {
            if (typeof item === 'string') {
              const trimmed = item.trim();
              if (trimmed.length > 0) {
                const lower = trimmed.toLowerCase();
                if (!seen.has(lower) && sanitized.length < MAX_SEARCH_HISTORY_ITEMS) {
                  seen.add(lower);
                  sanitized.push(trimmed);
                } else {
                  modified = true;
                }
              } else {
                modified = true;
              }
            } else {
              modified = true;
            }
          }

          if (modified) {
            localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(sanitized));
            repairedKeys.add(SEARCH_HISTORY_STORAGE_KEY);
            summaryMessages.push(
              `Sanitized recent search history in "${SEARCH_HISTORY_STORAGE_KEY}" to the latest ${MAX_SEARCH_HISTORY_ITEMS} valid queries.`
            );
          }
        }
      } catch {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify([]));
        repairedKeys.add(SEARCH_HISTORY_STORAGE_KEY);
        summaryMessages.push(
          `Recovered corrupted JSON in "${SEARCH_HISTORY_STORAGE_KEY}".`
        );
      }
    }
  } catch {
    // Ignore storage block errors
  }

  return {
    assets: finalAssets,
    currentUser: resolvedUser,
    authSession: validSession,
    aiConfig: resolvedAiConfig,
    report: {
      hadDiscrepancies: repairedKeys.size > 0 || summaryMessages.length > 0,
      repairedKeys: Array.from(repairedKeys),
      repairedAssetCount,
      migratedFromLegacyKey,
      summaryMessages,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Loads the persisted last 5 search queries from localStorage.
 */
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          result.push(trimmed);
          if (result.length >= MAX_SEARCH_HISTORY_ITEMS) break;
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Persists up to 5 recent search queries to localStorage.
 */
export function saveSearchHistory(queries: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const q of queries) {
    const trimmed = q.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      normalized.push(trimmed);
      if (normalized.length >= MAX_SEARCH_HISTORY_ITEMS) break;
    }
  }
  try {
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore write failure if storage quota exceeded
  }
  return normalized;
}

