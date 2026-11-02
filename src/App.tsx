import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { AssetDetailStudio } from './components/AssetDetailStudio';
import { AssetMultiplierModal } from './components/AssetMultiplierModal';
import { NewAssetModal } from './components/NewAssetModal';
import { AiConfigModal } from './components/AiConfigModal';
import { GuardBlockModal } from './components/GuardBlockModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ThrillLoadingScreen } from './components/ThrillLoadingScreen';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { QAInspectorModal } from './components/qa/QAInspectorModal';
import { Dashboard } from './components/Dashboard';
import { LiveTopologyDashboard } from './components/topology/LiveTopologyDashboard';
import { FloatingCopilot } from './components/copilot/FloatingCopilot';
import { useCopilotContext } from './hooks/useCopilotContext';
import { SuperAdminPage } from './components/SuperAdminPage';
import { AssetStatus, ContentAsset, FormatTier, PillarType, QuickFilterType, User, UserRole } from './types';
import { DEMO_SEED_ASSETS, INITIAL_ASSETS, SEED_USERS } from './lib/seedData';
import { validateStatusTransition } from './lib/stateMachine';
import { calculateSla } from './lib/sla';
import { clearSession } from './lib/auth';
import { serverTransitionAsset } from './lib/apiClient';
import {
  ASSETS_STORAGE_KEY,
  USER_STORAGE_KEY,
  StorageMigrationReport,
  validateAndMigrateStorage
} from './lib/storageMigration';
import { ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';
import { setUserContext, logInfo, logWarn, logError } from './lib/logger';
import {
  getSupabaseConfig,
  getSupabaseClient,
  fetchAssetsFromSupabase,
  upsertAssetToSupabase,
  deleteAssetFromSupabase,
  seedAssetsToSupabaseIfEmpty,
  mapSupabaseUserToUser,
  fetchUserProfileFromSupabase,
  supabaseSignOut
} from './lib/supabase';

export default function App() {
  // Run local storage structural validation & automatic in-place migration once on initialization
  const [initialStorage] = useState(() => validateAndMigrateStorage());
  const [migrationReport, setMigrationReport] = useState<StorageMigrationReport | null>(() =>
    initialStorage.report.hadDiscrepancies ? initialStorage.report : null
  );
  const [showMigrationDetails, setShowMigrationDetails] = useState<boolean>(false);

  // Supabase Configuration & Modal Tab state
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [authModalTab, setAuthModalTab] = useState<'picker' | 'supabase' | 'config'>('supabase');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'engine'>('profile');
  const [, setIsSupabaseSyncing] = useState<boolean>(false);

  // Session guard: authenticate if a valid session exists in storage, otherwise show auth modal
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(initialStorage.authSession?.user);
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    return !initialStorage.authSession?.user;
  });

  const [allUsers, setAllUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User>(initialStorage.currentUser);
  const [assets, setAssets] = useState<ContentAsset[]>(initialStorage.assets);

  // Synchronize telemetry user context with active authenticated user
  useEffect(() => {
    setUserContext(currentUser?.id, currentUser?.role);
  }, [currentUser]);

  // Supabase Real-time Session & Asset Hydration
  useEffect(() => {
    const handleStorageChange = () => {
      setSupabaseConfig(getSupabaseConfig());
    };
    window.addEventListener('storage', handleStorageChange);

    const config = getSupabaseConfig();
    if (config.isConfigured) {
      try {
        const supabase = getSupabaseClient();

        // 1. Restore active Supabase session & sync profile from 'profiles' table
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            let mapped = mapSupabaseUserToUser(session.user);
            // Fetch any custom profile row from 'profiles' table
            const remoteProfile = await fetchUserProfileFromSupabase(session.user.id);
            if (remoteProfile) {
              mapped = {
                ...mapped,
                ...remoteProfile,
                role: (remoteProfile.role as UserRole) || mapped.role
              };
            }
            setCurrentUser(mapped);
            setIsAuthenticated(true);
            setShowAuthModal(false);
          }
        }).catch((err) => {
          console.warn('Supabase getSession error:', err);
        });

        // 2. Subscribe to auth changes (sign-in, token refresh, sign-out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            let mapped = mapSupabaseUserToUser(session.user);
            const remoteProfile = await fetchUserProfileFromSupabase(session.user.id);
            if (remoteProfile) {
              mapped = {
                ...mapped,
                ...remoteProfile,
                role: (remoteProfile.role as UserRole) || mapped.role
              };
            }
            setCurrentUser(mapped);
            setIsAuthenticated(true);
            setShowAuthModal(false);
          }
        });

        // 3. Hydrate assets from Supabase PostgreSQL database
        setIsSupabaseSyncing(true);
        fetchAssetsFromSupabase().then(async (remoteAssets) => {
          setIsSupabaseSyncing(false);
          if (remoteAssets && remoteAssets.length > 0) {
            setAssets(remoteAssets);
          } else if (remoteAssets && remoteAssets.length === 0) {
            // Clean production database - keep pipeline empty
            setAssets([]);
          }
        }).catch((err) => {
          setIsSupabaseSyncing(false);
          console.warn('Supabase asset hydration error:', err);
        });

        return () => {
          subscription.unsubscribe();
          window.removeEventListener('storage', handleStorageChange);
        };
      } catch (err) {
        console.warn('Supabase initialization warning:', err);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [supabaseConfig.isConfigured]);

  // Modals & Drawers
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<ContentAsset | null>(null);
  const [selectedAssetForQa, setSelectedAssetForQa] = useState<ContentAsset | null>(null);
  const [selectedAssetForMultiplier, setSelectedAssetForMultiplier] = useState<ContentAsset | null>(null);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState<boolean>(true);
  const [loaderMode, setLoaderMode] = useState<'auto' | 'preview'>('auto');

  // Guard Block modal state
  const [guardBlock, setGuardBlock] = useState<{
    isOpen: boolean;
    reason: string;
    sourceStatus?: AssetStatus;
    targetStatus?: AssetStatus;
    asset?: ContentAsset;
  }>({
    isOpen: false,
    reason: ''
  });

  // Filters & Views
  const [currentView, setCurrentView] = useState<'pipeline' | 'sla' | 'multiplier' | 'archive' | 'dashboard' | 'admin' | 'topology'>('pipeline');
  const [selectedTier, setSelectedTier] = useState<FormatTier | 'ALL'>('ALL');
  const [selectedPillar, setSelectedPillar] = useState<PillarType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlySla, setFilterOnlySla] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('NONE');

  const handleChangeView = (view: 'pipeline' | 'sla' | 'multiplier' | 'archive' | 'dashboard' | 'admin' | 'topology') => {
    setCurrentView(view);
    if (view === 'sla') {
      setFilterOnlySla(true);
      setSelectedTier('ALL');
    } else if (view === 'multiplier') {
      const heroAsset = assets.find((a) => a.formatTier === 'HERO');
      if (heroAsset) {
        setSelectedAssetForMultiplier(heroAsset);
      } else {
        setIsNewAssetOpen(true);
      }
    } else if (view === 'dashboard' || view === 'archive' || view === 'admin' || view === 'topology') {
      setFilterOnlySla(false);
    } else {
      setFilterOnlySla(false);
    }
  };

  // Global Keyboard Shortcuts ('N' -> New Asset, 'S' -> Focus Search, 'Cmd+/' -> Help Overlay, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Toggle hidden Keyboard Shortcuts Help Overlay on Cmd+/ or Ctrl+/
      if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === '?' || e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        return;
      }

      // 2. Escape closes active overlays/modals in priority order
      if (e.key === 'Escape') {
        if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
          return;
        }
        if (guardBlock.isOpen) {
          setGuardBlock({ isOpen: false, reason: '' });
          return;
        }
        if (isAiConfigOpen) {
          setIsAiConfigOpen(false);
          return;
        }
        if (isNewAssetOpen) {
          setIsNewAssetOpen(false);
          return;
        }
        if (selectedAssetForMultiplier) {
          setSelectedAssetForMultiplier(null);
          return;
        }
        if (selectedAssetForQa) {
          setSelectedAssetForQa(null);
          return;
        }
        if (selectedAssetForDetail) {
          setSelectedAssetForDetail(null);
          return;
        }
        if (showAuthModal) {
          setShowAuthModal(false);
          return;
        }
        return;
      }

      // 3. Ignore single-key shortcuts when typing inside inputs, textareas, selects, or contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        const isEditable =
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable;
        if (isEditable) return;
      }

      // Ignore if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Allow '?' to toggle help overlay even if another modal isn't blocking
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        return;
      }

      // Do not trigger board-level single-key shortcuts while a modal is open
      const anyModalOpen =
        isShortcutsHelpOpen ||
        isNewAssetOpen ||
        isAiConfigOpen ||
        Boolean(selectedAssetForQa) ||
        Boolean(selectedAssetForDetail) ||
        Boolean(selectedAssetForMultiplier) ||
        guardBlock.isOpen ||
        showAuthModal;
      if (anyModalOpen) return;

      const lowerKey = e.key.toLowerCase();

      if (lowerKey === 'n') {
        e.preventDefault();
        setIsNewAssetOpen(true);
      } else if (lowerKey === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('contentops:focus-search'));
      } else if (lowerKey === 'm') {
        e.preventDefault();
        const heroAsset = assets.find((a) => a.formatTier === 'HERO');
        if (heroAsset) {
          setSelectedAssetForMultiplier(heroAsset);
        } else {
          setIsNewAssetOpen(true);
        }
      } else if (e.key === '1') {
        e.preventDefault();
        setSelectedTier('ALL');
        setFilterOnlySla(false);
        setQuickFilter('NONE');
      } else if (e.key === '2') {
        e.preventDefault();
        setSelectedTier('HERO');
      } else if (e.key === '3') {
        e.preventDefault();
        setSelectedTier('HUB');
      } else if (e.key === '4') {
        e.preventDefault();
        setSelectedTier('HYGIENE');
      } else if (lowerKey === 'q') {
        e.preventDefault();
        setQuickFilter((prev) => (prev === 'NEEDS_MY_SIGNOFF' ? 'NONE' : 'NEEDS_MY_SIGNOFF'));
      } else if (lowerKey === 'r') {
        e.preventDefault();
        setQuickFilter((prev) => (prev === 'SLA_RISK' ? 'NONE' : 'SLA_RISK'));
      } else if (lowerKey === 'd') {
        e.preventDefault();
        setCurrentView((prev) => (prev === 'dashboard' ? 'pipeline' : 'dashboard'));
      } else if (e.key === ',') {
        e.preventDefault();
        setSettingsTab('profile');
        setIsAiConfigOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    assets,
    guardBlock.isOpen,
    isAiConfigOpen,
    isNewAssetOpen,
    isShortcutsHelpOpen,
    selectedAssetForDetail,
    selectedAssetForQa,
    selectedAssetForMultiplier,
    showAuthModal
  ]);

  // Sync assets to storage
  useEffect(() => {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch {
      // ignore
    }
  }, [assets]);

  // Sync active user to storage
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_STORAGE_KEY, user.id);
    } catch {
      // ignore
    }
  };

  // User Profile Update handler (synced from SettingsModal directly to local session & Supabase profiles)
  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      return exists ? prev.map((u) => (u.id === updated.id ? updated : u)) : [updated, ...prev];
    });

    try {
      localStorage.setItem(USER_STORAGE_KEY, updated.id);
      const rawSession = localStorage.getItem('contentops_auth_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.user?.id === updated.id) {
          parsed.user = updated;
          localStorage.setItem('contentops_auth_session', JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore
    }
  };

  // State Machine Transition Handler
  const handleTransitionAsset = (asset: ContentAsset, targetStatus: AssetStatus) => {
    const result = validateStatusTransition(asset, targetStatus, currentUser);

    if (!result.allowed) {
      logWarn('state_machine_guard_rejected', result.reason || 'Transition guard rejected state change.', {
        assetId: asset.id,
        assetTitle: asset.title,
        sourceStatus: asset.status,
        targetStatus,
        actorRole: currentUser.role
      });
      setGuardBlock({
        isOpen: true,
        reason: result.reason || 'Transition guard rejected state change.',
        sourceStatus: asset.status,
        targetStatus,
        asset
      });
      return;
    }

    const updated: ContentAsset = {
      ...asset,
      ...result.updatedAsset,
      status: targetStatus,
      updatedAt: new Date().toISOString()
    };

    // Optimistic local update
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));

    // Wire to centralized server-side state machine enforcement & audit log
    serverTransitionAsset({
      assetId: asset.id,
      targetStage: targetStatus,
      reason: result.updatedAsset?.status ? `Advanced to ${targetStatus}` : undefined,
    }).catch((serverErr) => {
      console.warn('Backend serverTransitionAsset notice (continuing with database sync):', serverErr?.message);
    });

    if (supabaseConfig.isConfigured) {
      upsertAssetToSupabase(updated).catch((err) => {
        logError('supabase_asset_upsert_failed', err, { assetId: updated.id, status: targetStatus });
        console.warn('Failed to upsert transitioned asset to Supabase:', err);
      });
    }

    if (selectedAssetForDetail?.id === asset.id) {
      setSelectedAssetForDetail(updated);
    }
    if (selectedAssetForQa?.id === asset.id) {
      setSelectedAssetForQa(updated);
    }
  };

  // Save changes from AssetDetailStudio or Archive
  const handleUpdateAsset = (updated: ContentAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    if (supabaseConfig.isConfigured) {
      upsertAssetToSupabase(updated).catch((err) => {
        console.warn('Failed to upsert updated asset to Supabase:', err);
      });
    }

    if (selectedAssetForDetail?.id === updated.id) {
      setSelectedAssetForDetail(updated);
    }
    if (selectedAssetForQa?.id === updated.id) {
      setSelectedAssetForQa(updated);
    }
  };

  // Delete asset
  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));

    if (supabaseConfig.isConfigured) {
      deleteAssetFromSupabase(assetId).catch((err) => {
        console.warn('Failed to delete asset from Supabase:', err);
      });
    }

    if (selectedAssetForDetail?.id === assetId) {
      setSelectedAssetForDetail(null);
    }
    if (selectedAssetForQa?.id === assetId) {
      setSelectedAssetForQa(null);
    }
  };

  // Spawn children from Asset Multiplier
  const handleSpawnChildren = (newChildren: Partial<ContentAsset>[]) => {
    const nowIso = new Date().toISOString();
    const created: ContentAsset[] = newChildren.map((item, idx) => ({
      id: `asset-child-${Date.now()}-${idx}`,
      title: item.title || 'Untitled Derivative',
      description: item.description,
      pillar: item.pillar || 'CONTENT_OPS',
      formatTier: (item.formatTier as FormatTier) || 'HUB',
      status: 'DRAFT_BRIEF',
      priority: item.priority || 'HIGH',
      parentId: item.parentId || null,
      parentTitle: item.parentTitle,
      platformSpecs: item.platformSpecs || '1080x1920, 9:16 safe margins, -14 LUFS',
      hookStrategy: item.hookStrategy,
      targetKpi: item.targetKpi,
      rawIntakeNotes: item.rawIntakeNotes,
      slaHours: 48,
      isSlaBreached: false,
      qaToneApproved: false,
      qaSpecsValidated: false,
      qaRightsCleared: false,
      qaGatekeeperSigned: false,
      deliverableUrl: null,
      attachmentCount: 0,
      isWinningFormat: false,
      paidEligible: false,
      createdById: currentUser.id,
      assignedToId: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    setAssets((prev) => [...created, ...prev]);

    if (supabaseConfig.isConfigured) {
      created.forEach((c) => {
        upsertAssetToSupabase(c).catch((err) => {
          console.warn('Failed to upsert spawned child to Supabase:', err);
        });
      });
    }
  };

  // Create new asset brief
  const handleCreateAsset = (newAsset: ContentAsset) => {
    setAssets((prev) => [newAsset, ...prev]);

    if (supabaseConfig.isConfigured) {
      upsertAssetToSupabase(newAsset).catch((err) => {
        console.warn('Failed to upsert new asset to Supabase:', err);
      });
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    supabaseSignOut().catch(() => {});
    clearSession();
    setIsAuthenticated(false);
    setAuthModalTab('supabase');
    setShowAuthModal(true);
  };

  // Populate demo template assets on demand (for testing/preview)
  const handleLoadDemoData = () => {
    setAssets(DEMO_SEED_ASSETS);
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(DEMO_SEED_ASSETS));
    } catch {
      // ignore
    }
    if (supabaseConfig.isConfigured) {
      seedAssetsToSupabaseIfEmpty(DEMO_SEED_ASSETS).catch((err) => {
        console.warn('Failed to seed demo assets to Supabase:', err);
      });
    }
  };

  // Clear pipeline to clean zero-state
  const handleClearAllData = () => {
    setAssets([]);
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  // Reset to clean production baseline
  const handleResetData = () => {
    handleClearAllData();
  };

  // Live Copilot SystemContext Hydration
  const copilotContext = useCopilotContext(
    {
      assets,
      selectedTier,
      selectedPillar,
      quickFilter,
      filterOnlySla,
      searchQuery,
      focusedAsset: selectedAssetForDetail
    },
    currentUser
  );

  // Copilot Tool Action Relay Handlers
  const handleCopilotMoveStage = (assetId: string, targetStage: AssetStatus) => {
    const found = assets.find((a) => a.id === assetId);
    if (!found) return;
    handleTransitionAsset(found, targetStage);
  };

  const handleCopilotSignOffQa = (
    assetId: string,
    updates: {
      approveTone?: boolean;
      approveSpecs?: boolean;
      approveRights?: boolean;
      finalSignoff?: boolean;
    }
  ) => {
    const found = assets.find((a) => a.id === assetId);
    if (!found) return;
    const isContentManager = currentUser.role === 'CONTENT_MANAGER';
    const nextSigned = isContentManager ? Boolean(updates.finalSignoff ?? true) : found.qaGatekeeperSigned;

    const updated: ContentAsset = {
      ...found,
      qaToneApproved: updates.approveTone ?? true,
      qaSpecsValidated: updates.approveSpecs ?? true,
      qaRightsCleared: updates.approveRights ?? true,
      qaGatekeeperSigned: nextSigned,
      qaSignedById: nextSigned ? currentUser.id : found.qaSignedById,
      qaSignedByName: nextSigned ? currentUser.name : found.qaSignedByName,
      qaSignedAt: nextSigned ? new Date().toISOString() : found.qaSignedAt,
      status:
        nextSigned && found.status === 'QA_GATE'
          ? 'READY_TO_PUBLISH'
          : found.status,
      updatedAt: new Date().toISOString()
    };

    handleUpdateAsset(updated);
  };

  const handleCopilotTriggerMultiplier = (parentAssetId: string, derivativeCount: number = 3) => {
    const parent = assets.find((a) => a.id === parentAssetId) || assets.find((a) => a.formatTier === 'HERO') || assets[0];
    if (!parent) return;

    const baseTemplates: Partial<ContentAsset>[] = [
      {
        title: `Short-form Reel: 3 Bottlenecks Killing Creative Velocity`,
        description: 'High-velocity 45s vertical cutdown of the opening contrarian hook.',
        pillar: parent.pillar,
        formatTier: 'HUB',
        priority: 'HIGH',
        parentId: parent.id,
        parentTitle: parent.title,
        platformSpecs: '1080x1920, 9:16 safe margins, -14 LUFS',
        hookStrategy: 'Contrarian: "Stop scaling headcount before you fix your approval gates."'
      },
      {
        title: `LinkedIn Carousel Summary: The 5-Stage ContentOps State Machine`,
        description: '8-slide visual blueprint breaking down RACI governance and 48h SLA clocks.',
        pillar: parent.pillar,
        formatTier: 'HUB',
        priority: 'HIGH',
        parentId: parent.id,
        parentTitle: parent.title,
        platformSpecs: 'LinkedIn Carousel summary (1:1) • 1080x1080 PDF',
        hookStrategy: 'Curiosity: "How top teams cut review latency from 14 days to 48 hours."'
      },
      {
        title: `Quote Card & X Thread: "The Death of Unchecked Creative Drift"`,
        description: '7-post analytical thread paired with 3 high-contrast quote cards.',
        pillar: parent.pillar,
        formatTier: 'HYGIENE',
        priority: 'MEDIUM',
        parentId: parent.id,
        parentTitle: parent.title,
        platformSpecs: 'Quote card / X thread • 1:1 & 16:9 Social Pack',
        hookStrategy: 'Direct Value: "The 4-point QA checklist that blocks unreviewed publishing."'
      }
    ];

    handleSpawnChildren(baseTemplates.slice(0, derivativeCount));
  };

  const handleCopilotFilterBoard = (
    filterType: 'ALL' | 'HERO' | 'HUB' | 'HYGIENE' | 'SLA_ACTIVE' | 'NEEDS_QA' | 'SLA_RISK'
  ) => {
    if (filterType === 'ALL') {
      setSelectedTier('ALL');
      setFilterOnlySla(false);
      setQuickFilter('NONE');
    } else if (filterType === 'HERO' || filterType === 'HUB' || filterType === 'HYGIENE') {
      setSelectedTier(filterType);
      setFilterOnlySla(false);
      setQuickFilter('NONE');
    } else if (filterType === 'SLA_ACTIVE') {
      setFilterOnlySla(true);
      setSelectedTier('ALL');
      setQuickFilter('NONE');
    } else if (filterType === 'NEEDS_QA') {
      setQuickFilter('NEEDS_MY_SIGNOFF');
      setFilterOnlySla(false);
      setSelectedTier('ALL');
    } else if (filterType === 'SLA_RISK') {
      setQuickFilter('SLA_RISK');
      setFilterOnlySla(false);
      setSelectedTier('ALL');
    }
  };

  const handleCopilotDraftBrief = (draft: {
    title: string;
    formatTier: FormatTier;
    hookStrategy?: string;
    platformSpecs?: string;
  }) => {
    const nowIso = new Date().toISOString();
    const newAsset: ContentAsset = {
      id: `asset-copilot-${Date.now()}`,
      title: draft.title,
      pillar: 'STRATEGY_SERIES',
      formatTier: draft.formatTier,
      status: 'DRAFT_BRIEF',
      priority: 'HIGH',
      parentId: null,
      hookStrategy: draft.hookStrategy || 'Contrarian: "90% of platforms fake instant payouts. Here is live telemetry."',
      platformSpecs: draft.platformSpecs || '1080x1920, 9:16 safe margins, -14 LUFS',
      targetKpi: '68% 3s Retention Rate, >500 qualified saves',
      rawIntakeNotes: 'Drafted automatically via Thrill Copilot (IFM.ai K2 Horizon).',
      slaHours: 48,
      isSlaBreached: false,
      qaToneApproved: false,
      qaSpecsValidated: false,
      qaRightsCleared: false,
      qaGatekeeperSigned: false,
      deliverableUrl: null,
      attachmentCount: 0,
      isWinningFormat: false,
      paidEligible: false,
      createdById: currentUser.id,
      assignedToId: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    handleCreateAsset(newAsset);
  };

  // Active capacity count (non-published)
  const activePipelineCount = assets.filter((a) => a.status !== 'PUBLISHED').length;
  const breachedCount = assets.filter((a) => a.status === 'SLA_REVIEW' && calculateSla(a).isBreached).length;

  return (
    <div className="relative min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-[#00E599]/30 selection:text-white overflow-hidden">
      {/* Thrill Outlined -> White Liquid Fill Loading Screen */}
      {isBootLoading && (
        <ThrillLoadingScreen
          mode={loaderMode}
          onComplete={() => setIsBootLoading(false)}
        />
      )}

      {/* Main Workspace */}
      <div 
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          !isAuthenticated && showAuthModal 
            ? 'filter blur-md brightness-50 pointer-events-none select-none scale-[0.99] origin-center' 
            : ''
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          allUsers={allUsers}
          onSelectUser={handleSelectUser}
          activeCount={activePipelineCount}
          maxCapacity={25}
          onOpenNewAsset={() => setIsNewAssetOpen(true)}
          onOpenAiConfig={() => {
            setSettingsTab('profile');
            setIsAiConfigOpen(true);
          }}
          viewMode="kanban"
          onChangeViewMode={() => {}}
          breachedCount={breachedCount}
          onSignOut={handleSignOut}
          isAuthenticated={isAuthenticated}
          onOpenAuthModal={() => {
            setAuthModalTab('supabase');
            setShowAuthModal(true);
          }}
          onReplayLoader={() => {
            setLoaderMode('preview');
            setIsBootLoading(true);
          }}
          supabaseConfigured={supabaseConfig.isConfigured}
          onOpenSupabaseConfig={() => {
            setAuthModalTab('config');
            setShowAuthModal(true);
          }}
        />

        {/* Dismissible Automatic Storage Migration & Repair Notification */}
        {migrationReport && (
          <div
            role="status"
            aria-live="polite"
            className="bg-[#121620] border-b border-[#00E599]/30 px-6 py-2.5 text-xs text-white transition-all"
          >
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#00E599]/15 text-[#00E599] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-semibold text-white whitespace-nowrap">
                    Local Storage Schema Repaired
                  </span>
                  <span className="text-[#8F9CAE]" aria-hidden="true">·</span>
                  <span className="text-[#8F9CAE] truncate">
                    {migrationReport.summaryMessages[0] ||
                      'Automatic migration resolved structural discrepancies in stored state.'}
                  </span>
                  <span className="text-[#8F9CAE] font-mono tabular-nums whitespace-nowrap">
                    ({migrationReport.repairedKeys.join(', ')})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {migrationReport.summaryMessages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowMigrationDetails((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{showMigrationDetails ? 'Hide details' : `View all (${migrationReport.summaryMessages.length})`}</span>
                    {showMigrationDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMigrationReport(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/10 transition-colors whitespace-nowrap shrink-0"
                  aria-label="Dismiss storage repair notification"
                >
                  <span>Dismiss</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showMigrationDetails && migrationReport.summaryMessages.length > 1 && (
              <div className="max-w-[1600px] mx-auto mt-2 pt-2 border-t border-white/5 pl-9 space-y-1 text-[#8F9CAE]">
                {migrationReport.summaryMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#00E599] font-mono tabular-nums">{idx + 1}.</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Workspace with Collapsible Sidebar & Kanban Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <Sidebar
            currentView={currentView}
            onChangeView={handleChangeView}
            quickFilter={quickFilter}
            onChangeQuickFilter={setQuickFilter}
            assets={assets}
            currentUser={currentUser}
            onOpenNewAsset={() => setIsNewAssetOpen(true)}
            onOpenMultiplier={() => {
              const heroAsset = assets.find((a) => a.formatTier === 'HERO');
              if (heroAsset) setSelectedAssetForMultiplier(heroAsset);
              else setIsNewAssetOpen(true);
            }}
          />

          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#0B0E14]">
            {currentView === 'admin' ? (
              <SuperAdminPage
                currentUser={currentUser}
                onRefreshUsers={(fetchedUsers) => {
                  setAllUsers((prev) => {
                    const merged = [...prev];
                    fetchedUsers.forEach((fu) => {
                      const idx = merged.findIndex((m) => m.id === fu.id || m.email.toLowerCase() === fu.email.toLowerCase());
                      if (idx >= 0) merged[idx] = fu;
                      else merged.push(fu);
                    });
                    return merged;
                  });
                }}
              />
            ) : currentView === 'dashboard' ? (
              <Dashboard
                assets={assets}
                currentUser={currentUser}
                onNavigateToKanban={() => handleChangeView('pipeline')}
                onOpenNewAsset={() => setIsNewAssetOpen(true)}
              />
            ) : currentView === 'topology' ? (
              <LiveTopologyDashboard
                assets={assets}
                currentUser={currentUser}
                onNavigateToKanban={() => handleChangeView('pipeline')}
                onOpenAssetDetail={(asset) => {
                  if (asset.status === 'QA_GATE') {
                    setSelectedAssetForQa(asset);
                  } else {
                    setSelectedAssetForDetail(asset);
                  }
                }}
                onOpenNewAsset={() => setIsNewAssetOpen(true)}
              />
            ) : (
              <KanbanBoard
                assets={assets}
                allUsers={allUsers}
                currentUser={currentUser}
                onOpenDetail={(asset) => {
                  if (asset.status === 'QA_GATE') {
                    setSelectedAssetForQa(asset);
                  } else {
                    setSelectedAssetForDetail(asset);
                  }
                }}
                onOpenMultiplier={(asset) => setSelectedAssetForMultiplier(asset)}
                onTransitionAsset={handleTransitionAsset}
                onUpdateAsset={handleUpdateAsset}
                selectedTier={selectedTier}
                onChangeTier={setSelectedTier}
                selectedPillar={selectedPillar}
                onChangePillar={setSelectedPillar}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterOnlySla={filterOnlySla}
                onToggleOnlySla={() => setFilterOnlySla(!filterOnlySla)}
                quickFilter={quickFilter}
                onChangeQuickFilter={setQuickFilter}
                onOpenNewAsset={() => setIsNewAssetOpen(true)}
                onOpenDashboard={() => handleChangeView('dashboard')}
                onOpenTopology={() => handleChangeView('topology')}
                onLoadDemoData={handleLoadDemoData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating Thrill Copilot AI Agent (Bottom-Right) */}
      <FloatingCopilot
        context={copilotContext}
        assets={assets}
        currentUser={currentUser}
        onMoveAssetStage={handleCopilotMoveStage}
        onSignOffQa={handleCopilotSignOffQa}
        onTriggerMultiplier={handleCopilotTriggerMultiplier}
        onFilterBoard={handleCopilotFilterBoard}
        onDraftBrief={handleCopilotDraftBrief}
      />

      {/* Auth Popup Modal */}
      {showAuthModal && (
        <AuthPage 
          onLoginSuccess={(user) => {
            handleLoginSuccess(user);
            setSupabaseConfig(getSupabaseConfig());
          }} 
          onClose={() => setShowAuthModal(false)}
          initialTab={authModalTab}
        />
      )}

      {/* In-App Media Inspector & QA Studio Modal (STAGE 4: QA Gatekeeper) */}
      {selectedAssetForQa && (
        <QAInspectorModal
          asset={selectedAssetForQa}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setSelectedAssetForQa(null)}
          onUpdateAsset={handleUpdateAsset}
          onTransitionAsset={handleTransitionAsset}
          onOpenGeneralStudio={(asset) => {
            setSelectedAssetForQa(null);
            setSelectedAssetForDetail(asset);
          }}
        />
      )}

      {/* Detail & Brief Studio Modal */}
      {selectedAssetForDetail && (
        <AssetDetailStudio
          asset={selectedAssetForDetail}
          onClose={() => setSelectedAssetForDetail(null)}
          onUpdateAsset={handleUpdateAsset}
          allUsers={allUsers}
          currentUser={currentUser}
          onOpenMultiplier={(asset) => {
            setSelectedAssetForMultiplier(asset);
          }}
          onAttemptTransition={handleTransitionAsset}
          onDeleteAsset={handleDeleteAsset}
          onOpenQaInspector={(asset) => {
            setSelectedAssetForDetail(null);
            setSelectedAssetForQa(asset);
          }}
        />
      )}

      {/* Asset Multiplier Modal */}
      {selectedAssetForMultiplier && (
        <AssetMultiplierModal
          parentAsset={selectedAssetForMultiplier}
          onClose={() => setSelectedAssetForMultiplier(null)}
          onSpawnChildren={handleSpawnChildren}
          currentUser={currentUser}
        />
      )}

      {/* New Asset Modal */}
      <NewAssetModal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        onCreateAsset={handleCreateAsset}
        allUsers={allUsers}
        currentUser={currentUser}
      />

      {/* Application Settings & Profile Modal */}
      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        onResetData={handleResetData}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        initialTab={settingsTab}
      />

      {/* Guard Block Veto Alert Modal */}
      <GuardBlockModal
        isOpen={guardBlock.isOpen}
        onClose={() => setGuardBlock({ isOpen: false, reason: '' })}
        reason={guardBlock.reason}
        sourceStatus={guardBlock.sourceStatus}
        targetStatus={guardBlock.targetStatus}
        currentUser={currentUser}
        onOpenDetail={() => {
          if (guardBlock.asset) {
            setSelectedAssetForDetail(guardBlock.asset);
          }
        }}
      />

      {/* Hidden Cmd+/ Keyboard Shortcuts Help Overlay */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
