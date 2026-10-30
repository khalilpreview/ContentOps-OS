import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Settings, 
  Layers, 
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Cpu
} from 'lucide-react';
import { User, UserRole } from '../types';

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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeCount,
  maxCapacity,
  onOpenNewAsset,
  onOpenAiConfig,
  viewMode,
  onChangeViewMode,
  breachedCount
}) => {
  const capacityPercent = Math.min(100, Math.round((activeCount / maxCapacity) * 100));

  const roleLabels: Record<UserRole, { label: string; color: string; badge: string }> = {
    CONTENT_MANAGER: {
      label: 'Content Manager',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'Admin & QA Gatekeeper'
    },
    CREATIVE_SPECIALIST: {
      label: 'Creative Specialist',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      badge: 'Production Pod Doer'
    },
    STAKEHOLDER: {
      label: 'Stakeholder',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      badge: 'SLA Reviewer'
    },
    DISTRIBUTION_LEAD: {
      label: 'Distribution Lead',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badge: 'Publishing & Growth'
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 px-4 lg:px-6 py-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-zinc-100">
                ContentOps <span className="text-indigo-400">OS</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                MVP v1.4
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-300">
                <Cpu className="h-3 w-3 text-indigo-400 animate-pulse" />
                <span>IFM.ai K2 Horizon</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Deterministic State Machine • SLA Clocks • Asset Multiplier
            </p>
          </div>
        </div>

        {/* Middle: Capacity Meter & Breach alerts */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400 font-medium">Pipeline Load:</span>
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div 
                className={`h-full transition-all duration-300 ${
                  capacityPercent > 85 ? 'bg-rose-500' : capacityPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <span className="font-mono text-zinc-200">
              {activeCount}/{maxCapacity} Active
            </span>
          </div>

          {breachedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-medium animate-pulse">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              <span>{breachedCount} SLA Breached</span>
            </div>
          )}
        </div>

        {/* Right side: Active Role Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher */}
          <div className="relative group">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5 font-mono">
              Active Persona (RACI)
            </label>
            <div className="relative">
              <select
                aria-label="Select Active Persona"
                value={currentUser.id}
                onChange={(e) => {
                  const u = allUsers.find((x) => x.id === e.target.value);
                  if (u) onSelectUser(u);
                }}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 font-medium hover:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {roleLabels[u.role]?.label || u.role}
                  </option>
                ))}
              </select>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  currentUser.role === 'CONTENT_MANAGER' ? 'bg-emerald-400' :
                  currentUser.role === 'CREATIVE_SPECIALIST' ? 'bg-blue-400' :
                  currentUser.role === 'STAKEHOLDER' ? 'bg-purple-400' : 'bg-amber-400'
                }`} />
              </div>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* New Asset Button */}
          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-95"
            aria-label="Create New Content Asset Brief"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Brief</span>
          </button>

          {/* AI / Settings Button */}
          <button
            onClick={onOpenAiConfig}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors"
            title="IFM.ai K2 Horizon & SLA Engine Settings"
            aria-label="Engine Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
