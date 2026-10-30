import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { AssetDetailStudio } from './components/AssetDetailStudio';
import { AssetMultiplierModal } from './components/AssetMultiplierModal';
import { NewAssetModal } from './components/NewAssetModal';
import { AiConfigModal } from './components/AiConfigModal';
import { GuardBlockModal } from './components/GuardBlockModal';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { AssetStatus, ContentAsset, FormatTier, PillarType, User } from './types';
import { INITIAL_ASSETS, SEED_USERS } from './lib/seedData';
import { validateStatusTransition } from './lib/stateMachine';
import { getStoredSession, clearSession } from './lib/auth';

const ASSETS_STORAGE_KEY = 'contentops_assets_data';
const USER_STORAGE_KEY = 'contentops_active_user';

export default function App() {
  // Authentication session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return getStoredSession() !== null;
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    return getStoredSession() === null;
  });

  // Load users & initial state
  const [allUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const session = getStoredSession();
      if (session?.user) return session.user;
      const savedUserId = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUserId) {
        const found = SEED_USERS.find((u) => u.id === savedUserId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return SEED_USERS[0]; // Content Manager by default
  });

  const [assets, setAssets] = useState<ContentAsset[]>(() => {
    try {
      const saved = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_ASSETS;
  });

  // Modals & Drawers
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<ContentAsset | null>(null);
  const [selectedAssetForMultiplier, setSelectedAssetForMultiplier] = useState<ContentAsset | null>(null);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);

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
  const [currentView, setCurrentView] = useState<'pipeline' | 'sla' | 'multiplier' | 'archive'>('pipeline');
  const [selectedTier, setSelectedTier] = useState<FormatTier | 'ALL'>('ALL');
  const [selectedPillar, setSelectedPillar] = useState<PillarType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlySla, setFilterOnlySla] = useState(false);

  const handleChangeView = (view: 'pipeline' | 'sla' | 'multiplier' | 'archive') => {
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
    } else if (view === 'archive') {
      setFilterOnlySla(false);
    } else {
      setFilterOnlySla(false);
    }
  };

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

  // State Machine Transition Handler
  const handleTransitionAsset = (asset: ContentAsset, targetStatus: AssetStatus) => {
    const result = validateStatusTransition(asset, targetStatus, currentUser);

    if (!result.allowed) {
      setGuardBlock({
        isOpen: true,
        reason: result.reason || 'Transition guard rejected state change.',
        sourceStatus: asset.status,
        targetStatus,
        asset
      });
      return;
    }

    // Apply allowed transition updates
    const updated = {
      ...asset,
      ...result.updatedAsset,
      status: targetStatus,
      updatedAt: new Date().toISOString()
    };

    setAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));

    // If detail studio is open on this asset, sync it
    if (selectedAssetForDetail?.id === asset.id) {
      setSelectedAssetForDetail(updated);
    }
  };

  // Save changes from AssetDetailStudio
  const handleUpdateAsset = (updated: ContentAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAssetForDetail(updated);
  };

  // Delete asset
  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (selectedAssetForDetail?.id === assetId) {
      setSelectedAssetForDetail(null);
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
      priority: item.priority || 'MEDIUM',
      parentId: item.parentId || null,
      parentTitle: item.parentTitle,
      platformSpecs: item.platformSpecs,
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
      isWinningFormat: false,
      paidEligible: false,
      createdById: currentUser.id,
      assignedToId: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    setAssets((prev) => [...created, ...prev]);
  };

  // Create new asset brief
  const handleCreateAsset = (newAsset: ContentAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    clearSession();
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setAssets(INITIAL_ASSETS);
    try {
      localStorage.removeItem(ASSETS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Active capacity count (non-published)
  const activePipelineCount = assets.filter((a) => a.status !== 'PUBLISHED').length;
  const breachedCount = assets.filter((a) => a.status === 'SLA_REVIEW' && a.isSlaBreached).length;

  return (
    <div className="relative min-h-screen bg-[#0f1118] text-white flex flex-col font-sans selection:bg-[#4ff8ac]/30 selection:text-white overflow-hidden">
      {/* Background Dashboard: Blurred when Auth modal is active */}
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
          onOpenNewAsset={() => {
            if (!isAuthenticated) {
              setShowAuthModal(true);
              return;
            }
            setIsNewAssetOpen(true);
          }}
          onOpenAiConfig={() => setIsAiConfigOpen(true)}
          viewMode="kanban"
          onChangeViewMode={() => {}}
          breachedCount={breachedCount}
          onSignOut={handleSignOut}
          isAuthenticated={isAuthenticated}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

        {/* Main Workspace with Sidebar & Kanban Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <Sidebar
            currentView={currentView}
            onChangeView={handleChangeView}
            assets={assets}
            onOpenNewAsset={() => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }
              setIsNewAssetOpen(true);
            }}
            onOpenMultiplier={() => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }
              const heroAsset = assets.find((a) => a.formatTier === 'HERO');
              if (heroAsset) setSelectedAssetForMultiplier(heroAsset);
              else setIsNewAssetOpen(true);
            }}
          />

          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#0f1118]">
            <KanbanBoard
              assets={assets}
              allUsers={allUsers}
              currentUser={currentUser}
              onOpenDetail={(asset) => setSelectedAssetForDetail(asset)}
              onOpenMultiplier={(asset) => setSelectedAssetForMultiplier(asset)}
              onTransitionAsset={handleTransitionAsset}
              selectedTier={selectedTier}
              onChangeTier={setSelectedTier}
              selectedPillar={selectedPillar}
              onChangePillar={setSelectedPillar}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterOnlySla={filterOnlySla}
              onToggleOnlySla={() => setFilterOnlySla(!filterOnlySla)}
            />
          </main>
        </div>
      </div>

      {/* Auth Popup Modal with Blurred Dashboard in Background */}
      {(!isAuthenticated || showAuthModal) && (
        <AuthPage 
          onLoginSuccess={handleLoginSuccess} 
          onClose={() => setShowAuthModal(false)}
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
        />
      )}

      {/* Asset Multiplier Drawer / Modal */}
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

      {/* AI & Engine Config Modal */}
      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        onResetData={handleResetData}
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
    </div>
  );
}
