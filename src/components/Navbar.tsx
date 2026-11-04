import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  ChevronDown, 
  Clock, 
  LogOut,
  LogIn,
  ShieldCheck,
  UserCog
} from 'lucide-react';
import { User, UserRole } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentUser: User;
  allUsers?: User[];
  onSelectUser?: (user: User) => void;
  activeCount: number;
  maxCapacity: number;
  onOpenNewAsset: () => void;
  onOpenAiConfig: () => void;
  viewMode: 'kanban' | 'multiplier';
  onChangeViewMode: (mode: 'kanban' | 'multiplier') => void;
  breachedCount: number;
  onSignOut?: () => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onReplayLoader?: () => void;
  supabaseConfigured?: boolean;
  onOpenSupabaseConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers: _allUsers,
  onSelectUser: _onSelectUser,
  activeCount,
  maxCapacity,
  onOpenNewAsset,
  onOpenAiConfig,
  breachedCount,
  onSignOut,
  isAuthenticated = true,
  onOpenAuthModal,
  onReplayLoader,
  supabaseConfigured = false,
  onOpenSupabaseConfig
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const capacityPercent = Math.min(100, Math.round((activeCount / maxCapacity) * 100));

  const roleLabels: Record<UserRole, { label: string; badge: string; dotColor: string; textColor: string }> = {
    SUPER_ADMIN: {
      label: 'Super Administrator',
      badge: 'All Permissions & Invites',
      dotColor: 'bg-[#FF4B55]',
      textColor: 'text-[#FF4B55]'
    },
    CONTENT_MANAGER: {
      label: 'Content Manager',
      badge: 'Can Sign QA & Approve',
      dotColor: 'bg-[#00E599]',
      textColor: 'text-[#00E599]'
    },
    CREATIVE_SPECIALIST: {
      label: 'Creative Specialist',
      badge: 'QA Final Sign-off Locked',
      dotColor: 'bg-[#F5A524]',
      textColor: 'text-[#F5A524]'
    },
    STAKEHOLDER: {
      label: 'Stakeholder',
      badge: 'SLA Reviewer • QA Locked',
      dotColor: 'bg-sky-400',
      textColor: 'text-sky-400'
    },
    DISTRIBUTION_LEAD: {
      label: 'Distribution Lead',
      badge: 'Syndication & Growth',
      dotColor: 'bg-purple-400',
      textColor: 'text-purple-400'
    }
  };

  const activeRoleMeta = roleLabels[currentUser.role] || roleLabels.CONTENT_MANAGER;

  return (
    <header className="sticky top-0 z-30 bg-[#121620]/95 backdrop-blur-md border-b border-white/[0.08] text-white px-4 lg:px-6 py-2.5 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Thrill Brand Logo + Active Production Pipeline Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReplayLoader}
            className="text-left focus:outline-none cursor-pointer group"
            title="Replay Thrill Liquid Loading Screen"
          >
            <BrandLogo size="md" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-[#8F9CAE] pl-2 border-l border-white/10">
            <span className="font-medium text-white">Active Production Pipeline</span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#181E2C] border border-white/[0.07] text-[11px] text-[#00E599] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
            <span>IFM K2 Horizon</span>
          </div>

          {onOpenSupabaseConfig && (
            <button
              type="button"
              onClick={onOpenSupabaseConfig}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#181E2C] hover:bg-[#202738] border border-white/[0.07] hover:border-[#00E599]/30 text-[11px] font-mono transition-colors cursor-pointer"
              title="Configure Supabase Database & Auth"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${supabaseConfigured ? 'bg-[#00E599]' : 'bg-[#F5A524]'}`} />
              <span className={supabaseConfigured ? 'text-[#00E599]' : 'text-[#F5A524]'}>
                {supabaseConfigured ? 'Supabase DB & Auth' : 'Supabase Config'}
              </span>
            </button>
          )}
        </div>

        {/* Center: Capacity bar & SLA breach alert */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#181E2C] border border-white/[0.07] text-xs">
            <span className="text-[#8F9CAE] font-medium text-[11px]">Active Sprint:</span>
            <div className="w-20 h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/[0.07]">
              <div 
                className={`h-full transition-all duration-300 ${
                  capacityPercent > 85 ? 'bg-[#FF4B55]' : capacityPercent > 65 ? 'bg-[#F5A524]' : 'bg-[#00E599]'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <span className="font-mono text-white font-semibold text-[11px] tabular-nums">
              {activeCount} / {maxCapacity} Capacity
            </span>
          </div>

          {breachedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF4B55]/15 border border-[#FF4B55]/40 text-[#FF4B55] text-xs font-semibold tabular-nums">
              <Clock className="h-3.5 w-3.5 text-[#FF4B55]" />
              <span>{breachedCount} SLA Breached</span>
            </div>
          )}
        </div>

        {/* Right: Active Operator Profile Menu, + New Brief Button, Settings, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Operator Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-label="Active Operator Profile"
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-2.5 bg-[#181E2C] hover:bg-[#1E2536] border border-white/[0.07] hover:border-[#00E599]/40 rounded-lg px-2.5 py-1.5 text-xs text-white transition-all cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-white/15"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-semibold text-white text-xs">{currentUser.name}</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${activeRoleMeta.dotColor}`} />
                </div>
                <span className="text-[10px] text-[#8F9CAE] block mt-0.5 leading-none">
                  {activeRoleMeta.label}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-[#8F9CAE] transition-transform ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Operator Identity Dropdown Card */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-76 rounded-xl bg-[#181E2C] border border-white/10 shadow-2xl py-3 px-3.5 z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.07]">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[#00E599]/40 shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-[#8F9CAE] truncate">{currentUser.email}</div>
                  </div>
                </div>

                {/* Role & Pod Metadata */}
                <div className="py-2.5 space-y-1.5 border-b border-white/[0.07]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8F9CAE]">RACI Governance:</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${activeRoleMeta.textColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeRoleMeta.dotColor}`} />
                      {activeRoleMeta.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8F9CAE]">Operational Pod:</span>
                    <span className="text-white font-medium">{currentUser.department || currentUser.team || 'Production Pod'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121620] text-[11px] text-[#8F9CAE] mt-1">
                    <span className="text-[#00E599] font-mono font-semibold">Scope: </span>
                    {activeRoleMeta.badge}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAiConfig();
                    }}
                    className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-[#00E599]" />
                      <span>Edit Profile &amp; Settings</span>
                    </span>
                  </button>

                  {isAuthenticated && onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold text-[#FF4B55] hover:bg-[#FF4B55]/10 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-[#FF4B55]" />
                        <span>Sign Out of Account</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenAiConfig}
            className="h-9 w-9 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] border border-white/[0.07] text-[#8F9CAE] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="IFM.ai K2 Horizon & Engine Settings"
            aria-label="Engine Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Sign Out Button */}
          {isAuthenticated && onSignOut ? (
            <button
              onClick={onSignOut}
              className="h-9 w-9 rounded-lg bg-[#181E2C] hover:bg-[#FF4B55]/15 border border-white/[0.07] hover:border-[#FF4B55]/40 text-[#8F9CAE] hover:text-[#FF4B55] flex items-center justify-center transition-colors cursor-pointer"
              title={`Sign Out (${currentUser.email})`}
              aria-label="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg bg-[#00E599] hover:bg-[#00c985] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sign in with Supabase"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
