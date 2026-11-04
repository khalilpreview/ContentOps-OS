import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Globe, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  User as UserIcon, 
  Users, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import { User, UserRole } from '../types';
import { AiConfig, getStoredAiConfig, saveStoredAiConfig } from '../lib/aiService';
import { syncUserProfileToSupabase, getSupabaseConfig } from '../lib/supabase';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  currentUser?: User;
  onUpdateUser?: (updated: User) => void;
  initialTab?: 'profile' | 'engine';
}

const AVATAR_PRESETS = [
  {
    name: 'Content Manager',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Creative Specialist',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Brand Stakeholder',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Distribution Lead',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Super Administrator',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  }
];

const TEAM_PRESETS = [
  'Executive ContentOps Pod',
  'Motion & Visual Creative Pod',
  'Brand Guardianship & Executive Review',
  'Omnichannel Syndication & Paid Media',
  'Autonomous AI Operations Pod'
];

const ROLE_DEFINITIONS: Array<{
  role: UserRole;
  title: string;
  badge: string;
  dotColor: string;
  description: string;
  governance: string;
}> = [
  {
    role: 'CONTENT_MANAGER',
    title: 'Content Manager',
    badge: 'ACCOUNTABLE',
    dotColor: 'bg-[#00E599]',
    description: 'Lead publisher with full RACI gatekeeper sign-off veto and multiplier rights.',
    governance: 'Stage 4 QA Gatekeeper Sign-off • Stage 5 Syndication Approval'
  },
  {
    role: 'CREATIVE_SPECIALIST',
    title: 'Creative Specialist',
    badge: 'RESPONSIBLE',
    dotColor: 'bg-[#3B82F6]',
    description: 'Execution pod operator creating briefs, video deliverables, and aspect cuts.',
    governance: 'Stage 1 Drafting • Stage 3 Pod Execution • Deliverable Uploads'
  },
  {
    role: 'STAKEHOLDER',
    title: 'Stakeholder',
    badge: 'CONSULTED',
    dotColor: 'bg-[#F5A524]',
    description: 'Cross-functional executive reviewing narrative hooks and brand SLA compliance.',
    governance: 'Stage 2 SLA Turnaround Review • Brand Brief Feedback'
  },
  {
    role: 'DISTRIBUTION_LEAD',
    title: 'Distribution Lead',
    badge: 'INFORMED',
    dotColor: 'bg-[#8B5CF6]',
    description: 'Growth and omnichannel specialist syndicating winning formats to paid ads.',
    governance: 'Stage 5 Distribution • Post-Launch 3s Retention Tracking'
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  currentUser,
  onUpdateUser,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'engine'>(initialTab);

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  );
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'CONTENT_MANAGER');
  const [team, setTeam] = useState(currentUser?.team || currentUser?.department || 'Production Pod');

  // Status & Feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Engine Configuration State
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    apiKey: '',
    baseUrl: 'https://api.ifm.ai/v1',
    model: 'k2-horizon'
  });
  const [engineSavedSuccess, setEngineSavedSuccess] = useState(false);

  // Supabase Status
  const supabaseConfig = getSupabaseConfig();

  // Reset local state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setAvatarUrl(currentUser.avatarUrl || AVATAR_PRESETS[0].url);
        setRole(currentUser.role);
        setTeam(currentUser.team || currentUser.department || 'Executive ContentOps Pod');
      }
      setAiConfig(getStoredAiConfig());
      setSyncSuccess(null);
      setSyncError(null);
      setActiveTab(initialTab);
    }
  }, [isOpen, currentUser, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);

    const updatedUser: User = {
      id: currentUser?.id || 'u-cm',
      name: name.trim() || 'ContentOps Operator',
      email: email.trim() || 'operator@thrill.ai',
      role,
      avatarUrl: avatarUrl.trim(),
      team: team.trim(),
      department: team.trim()
    };

    try {
      // 1. Sync directly to the 'profiles' table in Supabase
      const result = await syncUserProfileToSupabase({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        team: updatedUser.team
      });

      if (!result.success && result.error) {
        setSyncError(`Supabase notice: ${result.error}`);
      } else {
        setSyncSuccess(
          supabaseConfig.isConfigured
            ? "User profile & custom metadata synced to Supabase 'profiles' table!"
            : "User profile updated and saved locally! (Connect Supabase to sync remotely)"
        );
      }

      // 2. Dispatch to application state
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setTimeout(() => {
        setSyncSuccess(null);
      }, 3500);
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to sync user profile.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEngineConfig = () => {
    saveStoredAiConfig(aiConfig);
    setEngineSavedSuccess(true);
    setTimeout(() => setEngineSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#181E2C] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Navigation Tabs */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 text-[#00E599] flex items-center justify-center border border-[#00E599]/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Application &amp; Operator Settings</span>
                {supabaseConfig.isConfigured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                    Supabase Synced
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8F9CAE]">
                Configure operator identity, RACI role permissions, and engine parameters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-[#121620] border-b border-white/[0.07] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#0B0E14] text-[#00E599] border-t-2 border-t-[#00E599] border-x border-white/[0.08]'
                : 'text-[#8F9CAE] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Operator Profile &amp; RACI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-[#0B0E14] text-[#00E599] border-t-2 border-t-[#00E599] border-x border-white/[0.08]'
                : 'text-[#8F9CAE] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>AI Engine &amp; Pipeline</span>
          </button>
        </div>

        {/* Tab 1: Operator Profile & Metadata */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh] bg-[#0B0E14]">
            {/* Supabase Profiles Sync Banner */}
            <div className="p-3.5 rounded-xl bg-[#121620] border border-white/[0.08] flex items-start gap-3">
              <Database className={`h-4 w-4 shrink-0 mt-0.5 ${supabaseConfig.isConfigured ? 'text-[#00E599]' : 'text-[#F5A524]'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-bold text-white">
                    Supabase &#39;profiles&#39; Table Sync
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    supabaseConfig.isConfigured 
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30' 
                      : 'bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/30'
                  }`}>
                    {supabaseConfig.isConfigured ? '● DB CONNECTED' : '○ LOCAL STORAGE ONLY'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8F9CAE]">
                  Updates to your avatar URL, RACI governance role, and team directly sync with the{' '}
                  <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">public.profiles</code> table and Auth User Metadata in Supabase.
                </p>
              </div>
            </div>

            {/* Success / Error Feedback */}
            {syncSuccess && (
              <div className="p-3 rounded-lg bg-[#00E599]/10 border border-[#00E599]/30 text-[#00E599] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{syncSuccess}</span>
              </div>
            )}
            {syncError && (
              <div className="p-3 rounded-lg bg-[#FF4B55]/10 border border-[#FF4B55]/30 text-[#FF4B55] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {/* Identity & Avatar Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-[#121620] border border-white/[0.06]">
              {/* Avatar Live Preview */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center gap-2 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-4">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={name}
                    onError={(e) => {
                      // Fallback image on broken URL
                      (e.target as HTMLImageElement).src = AVATAR_PRESETS[0].url;
                    }}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-[#00E599]"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-[#181E2C] rounded-full border border-white/20">
                    <Shield className="h-3.5 w-3.5 text-[#00E599]" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-white text-xs">{name || 'Operator'}</div>
                  <div className="text-[10px] text-[#8F9CAE] truncate max-w-[140px]">{team}</div>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label className="block text-[#8F9CAE] text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Operator Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Full Name (e.g. Sarah Connor)"
                    className="w-full bg-[#181E2C] border border-white/[0.08] focus:border-[#00E599] rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#8F9CAE] text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Work Email (Supabase Auth ID)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="operator@company.com"
                    className="w-full bg-[#181E2C] border border-white/[0.08] focus:border-[#00E599] rounded-lg px-3 py-2 text-white focus:outline-none transition-colors font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Custom Avatar URL & Quick Presets */}
            <div className="space-y-2">
              <label className="block text-[#8F9CAE] text-[11px] font-semibold uppercase tracking-wider">
                Custom Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                required
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#181E2C] border border-white/[0.08] focus:border-[#00E599] rounded-lg px-3 py-2 text-white font-mono text-[11px] focus:outline-none transition-colors"
              />

              {/* Avatar Preset Chips */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-[#8F9CAE] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#00E599]" />
                  <span>Presets:</span>
                </span>
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] transition-all cursor-pointer ${
                      avatarUrl === preset.url
                        ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 font-semibold'
                        : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/[0.07] hover:bg-[#1E2536]'
                    }`}
                  >
                    <img src={preset.url} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RACI Role Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[#8F9CAE] text-[11px] font-semibold uppercase tracking-wider">
                  RACI Governance Role (Permitted Operations)
                </label>
                <span className="text-[10px] font-mono text-[#00E599]">Strict State Machine Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_DEFINITIONS.map((def) => {
                  const isSelected = role === def.role;
                  return (
                    <button
                      key={def.role}
                      type="button"
                      onClick={() => setRole(def.role)}
                      className={`p-3 rounded-xl text-left border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-[#00E599]/10 border-[#00E599]'
                          : 'bg-[#181E2C] border-white/[0.07] hover:border-white/20 hover:bg-[#1E2536]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${def.dotColor}`} />
                          <span className="font-semibold text-white text-xs">{def.title}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#00E599] text-[#0B0E14]' : 'bg-white/10 text-[#8F9CAE]'
                        }`}>
                          {def.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8F9CAE] leading-relaxed">
                        {def.description}
                      </p>
                      <div className="text-[9px] text-white/50 pt-1 border-t border-white/[0.05] truncate">
                        {def.governance}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team / Department Pod */}
            <div className="space-y-2">
              <label className="block text-[#8F9CAE] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#8F9CAE]" />
                <span>Operating Team / Pod Identifier</span>
              </label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                required
                placeholder="e.g., Executive ContentOps Pod"
                className="w-full bg-[#181E2C] border border-white/[0.08] focus:border-[#00E599] rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
              />

              {/* Quick Team Presets */}
              <div className="pt-1 flex flex-wrap gap-1.5">
                {TEAM_PRESETS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTeam(t)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                      team === t
                        ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40'
                        : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/[0.06] hover:bg-[#1E2536]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#8F9CAE]">
                {currentUser?.id ? `Operator ID: ${currentUser.id}` : 'Local Session'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00E599] hover:bg-[#00cc88] disabled:opacity-50 text-[#0B0E14] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0B0E14] border-t-transparent animate-spin" />
                      <span>Syncing to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save &amp; Sync to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: AI Engine & Pipeline */}
        {activeTab === 'engine' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh] bg-[#0B0E14]">
            <div className="p-3.5 rounded-xl bg-[#121620] border border-white/[0.08] text-[#8F9CAE] flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white mb-0.5">
                  IFM.ai K2 Horizon Engine
                </span>
                <span>
                  Powers 1-click Auto-Briefing, 3s Hook Generation (Contrarian, Curiosity, Direct Value), and the Asset Multiplier Repurposing Engine.
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[#8F9CAE]" />
                <span>Endpoint Base URL</span>
              </label>
              <input
                type="text"
                value={aiConfig.baseUrl}
                onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                placeholder="https://api.ifm.ai/v1"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#8F9CAE]" />
                <span>Model Identifier</span>
              </label>
              <input
                type="text"
                value={aiConfig.model}
                onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                placeholder="k2-horizon"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveEngineConfig}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00E599] hover:bg-[#00cc88] text-[#0B0E14] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{engineSavedSuccess ? 'Saved!' : 'Save Engine Configuration'}</span>
              </button>
            </div>

            {/* Clear Local Pipeline Cache */}
            <div className="pt-4 mt-2 border-t border-white/[0.07] flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Clear Local Pipeline Cache</span>
                <span className="text-[11px] text-[#8F9CAE]">
                  Purges browser-cached asset state to clean production baseline
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF4B55]/15 hover:bg-[#FF4B55]/25 border border-[#FF4B55]/40 text-[#FF4B55] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
