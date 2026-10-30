import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Settings, 
  ChevronDown, 
  Clock, 
  Cpu, 
  LogOut,
  SlidersHorizontal,
  Bell,
  Search
} from 'lucide-react';
import { User, UserRole } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeCount,
  maxCapacity,
  onOpenNewAsset,
  onOpenAiConfig,
  breachedCount,
  onSignOut,
  isAuthenticated = true,
  onOpenAuthModal
}) => {
  const capacityPercent = Math.min(100, Math.round((activeCount / maxCapacity) * 100));

  const roleLabels: Record<UserRole, { label: string; badge: string; color: string }> = {
    CONTENT_MANAGER: {
      label: 'Content Manager',
      badge: 'Admin & QA Gatekeeper',
      color: 'bg-[#4ff8ac]'
    },
    CREATIVE_SPECIALIST: {
      label: 'Creative Specialist',
      badge: 'Production Pod Doer',
      color: 'bg-blue-400'
    },
    STAKEHOLDER: {
      label: 'Stakeholder',
      badge: 'SLA Reviewer',
      color: 'bg-purple-400'
    },
    DISTRIBUTION_LEAD: {
      label: 'Distribution Lead',
      badge: 'Publishing & Growth',
      color: 'bg-amber-400'
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f1118]/95 backdrop-blur-md border-b border-[#252837] text-zinc-100 px-4 lg:px-6 py-2.5 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Logo using user's exact SVG + ContentOps OS */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181a24] border border-[#252837] text-[10px] text-[#4ff8ac] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ff8ac] animate-pulse" />
            <span>K2 Horizon Online</span>
          </div>
        </div>

        {/* Center: Capacity bar & SLA breach ticker */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#181a24] border border-[#252837] text-xs">
            <span className="text-[#8b93a7] font-medium text-[11px]">Pipeline Volume:</span>
            <div className="w-24 h-2 bg-[#10121a] rounded-full overflow-hidden border border-[#252837]">
              <div 
                className={`h-full transition-all duration-300 ${
                  capacityPercent > 85 ? 'bg-rose-500' : capacityPercent > 60 ? 'bg-amber-400' : 'bg-[#4ff8ac]'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <span className="font-mono text-zinc-200 text-[11px]">
              {activeCount}/{maxCapacity}
            </span>
          </div>

          {breachedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs font-semibold animate-pulse">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              <span>{breachedCount} SLA Breached</span>
            </div>
          )}
        </div>

        {/* Right: Persona dropdown, Notification squircle, Glowing Mint CTA Button, Settings, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Persona selector styled like wallet balance in reference */}
          <div className="relative group">
            <div className="relative">
              <select
                aria-label="Select Active Persona"
                value={currentUser.id}
                onChange={(e) => {
                  const u = allUsers.find((x) => x.id === e.target.value);
                  if (u) onSelectUser(u);
                }}
                className="appearance-none bg-[#181a24] hover:bg-[#1d202d] border border-[#252837] hover:border-[#4ff8ac]/40 rounded-xl pl-8 pr-7 py-2 text-xs text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-[#4ff8ac] cursor-pointer shadow-sm transition-colors"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({roleLabels[u.role]?.label || u.role})
                  </option>
                ))}
              </select>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${roleLabels[currentUser.role]?.color || 'bg-[#4ff8ac]'}`} />
              </div>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b93a7] pointer-events-none" />
            </div>
          </div>

          {/* Primary Action Button (Matches electric mint WALLET button from screenshot!) */}
          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 bg-[#4ff8ac] hover:bg-[#38ef98] text-[#0f1118] px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-lg shadow-[#4ff8ac]/20 transition-all active:scale-95 cursor-pointer"
            aria-label="Create New Content Asset Brief"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>New Brief</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenAiConfig}
            className="h-9 w-9 rounded-xl bg-[#181a24] hover:bg-[#202330] border border-[#252837] text-[#8b93a7] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="IFM.ai K2 Horizon & Engine Settings"
            aria-label="Engine Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Sign In button if unauthenticated */}
          {!isAuthenticated && onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-200 text-[#0f1118] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Sign Out Button if authenticated */}
          {isAuthenticated && onSignOut && (
            <button
              onClick={onSignOut}
              className="h-9 w-9 rounded-xl bg-[#181a24] hover:bg-rose-950/60 border border-[#252837] hover:border-rose-600/50 text-[#8b93a7] hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
              title={`Sign Out (${currentUser.email})`}
              aria-label="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
