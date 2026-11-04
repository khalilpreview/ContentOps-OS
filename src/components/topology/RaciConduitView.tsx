import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  UserCheck, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  FileText, 
  Palette, 
  Send, 
  TrendingUp, 
  Info,
  User as UserIcon
} from 'lucide-react';
import { ContentAsset, User, UserRole } from '../../types';

interface RaciConduitViewProps {
  assets: ContentAsset[];
  currentUser: User;
  allUsers?: User[];
  onOpenAssetDetail: (asset: ContentAsset) => void;
}

interface RaciChamber {
  stageNumber: number;
  id: string;
  name: string;
  accountableRole: UserRole;
  accountableLabel: string;
  responsibleRoles: UserRole[];
  responsibleLabel: string;
  consultedRoles: UserRole[];
  consultedLabel: string;
  informedRoles: UserRole[];
  informedLabel: string;
  isGatekeeperLock?: boolean;
}

export const RaciConduitView: React.FC<RaciConduitViewProps> = ({
  assets,
  currentUser,
  allUsers = []
}) => {
  const [activePersonaFilter, setActivePersonaFilter] = useState<UserRole | 'ALL'>('ALL');

  // Derive dynamic operators from active database / directory state
  const cmUsers = allUsers.filter((u) => u.role === 'CONTENT_MANAGER' || u.role === 'SUPER_ADMIN');
  const creativeUsers = allUsers.filter((u) => u.role === 'CREATIVE_SPECIALIST');
  const distroUsers = allUsers.filter((u) => u.role === 'DISTRIBUTION_LEAD');
  const stakeholderUsers = allUsers.filter((u) => u.role === 'STAKEHOLDER');

  const cmLabel = cmUsers.length > 0
    ? `${cmUsers[0].name} (Content Manager)`
    : 'Content Operations Lead (Content Manager)';

  const creativeLabel = creativeUsers.length > 0
    ? `${creativeUsers.map(u => u.name).slice(0, 2).join(', ')} (Creative Pod)`
    : 'Creative Specialists Pod';

  const distroLabel = distroUsers.length > 0
    ? `${distroUsers[0].name} (Distribution Lead)`
    : 'Growth & Distribution Lead';

  const stakeholderLabel = stakeholderUsers.length > 0
    ? `${stakeholderUsers.map(u => u.name).slice(0, 2).join(', ')} (Stakeholders)`
    : 'Executive Stakeholders';

  const RACI_CHAMBERS: RaciChamber[] = [
    {
      stageNumber: 1,
      id: 'strategy_briefing',
      name: 'Strategy & Briefing',
      accountableRole: 'CONTENT_MANAGER',
      accountableLabel: cmLabel,
      responsibleRoles: ['CONTENT_MANAGER', 'CREATIVE_SPECIALIST'],
      responsibleLabel: `${cmLabel} & Creative Pods`,
      consultedRoles: ['STAKEHOLDER'],
      consultedLabel: stakeholderLabel,
      informedRoles: ['DISTRIBUTION_LEAD'],
      informedLabel: distroLabel
    },
    {
      stageNumber: 2,
      id: 'asset_creation',
      name: 'Asset Creation & Production',
      accountableRole: 'CONTENT_MANAGER',
      accountableLabel: cmLabel,
      responsibleRoles: ['CREATIVE_SPECIALIST'],
      responsibleLabel: creativeLabel,
      consultedRoles: ['CONTENT_MANAGER'],
      consultedLabel: 'Content Manager (Mid-sprint Checkins)',
      informedRoles: ['STAKEHOLDER', 'DISTRIBUTION_LEAD'],
      informedLabel: 'Stakeholders & Syndication Leads'
    },
    {
      stageNumber: 3,
      id: 'qa_gatekeeper',
      name: 'QA Gatekeeper & Veto Chamber',
      accountableRole: 'CONTENT_MANAGER',
      accountableLabel: `${cmLabel} (Separation of Duties)`,
      responsibleRoles: ['CONTENT_MANAGER'],
      responsibleLabel: 'Content Manager (Executes 4-pt signoff)',
      consultedRoles: ['CREATIVE_SPECIALIST'],
      consultedLabel: 'Creative Specialist (Resolves punch list)',
      informedRoles: ['STAKEHOLDER', 'DISTRIBUTION_LEAD'],
      informedLabel: 'Stakeholders & Growth Leads',
      isGatekeeperLock: true
    },
    {
      stageNumber: 4,
      id: 'publishing_syndication',
      name: 'Publishing & Syndication',
      accountableRole: 'DISTRIBUTION_LEAD',
      accountableLabel: distroLabel,
      responsibleRoles: ['DISTRIBUTION_LEAD'],
      responsibleLabel: distroLabel,
      consultedRoles: ['CONTENT_MANAGER'],
      consultedLabel: 'Content Manager (Release Windows)',
      informedRoles: ['STAKEHOLDER', 'CREATIVE_SPECIALIST'],
      informedLabel: 'All Pods & Leadership'
    },
    {
      stageNumber: 5,
      id: 'reporting_optimization',
      name: 'Reporting & Optimization',
      accountableRole: 'CONTENT_MANAGER',
      accountableLabel: cmLabel,
      responsibleRoles: ['DISTRIBUTION_LEAD', 'CONTENT_MANAGER'],
      responsibleLabel: `${distroLabel} & ${cmLabel}`,
      consultedRoles: ['STAKEHOLDER'],
      consultedLabel: stakeholderLabel,
      informedRoles: ['CREATIVE_SPECIALIST'],
      informedLabel: 'Creative Specialists (Feedback Loops)'
    }
  ];

  // Check QA Gatekeeper lock status
  const qaAssets = assets.filter((a) => a.status === 'QA_GATE');
  const unsignedQaAssets = qaAssets.filter((a) => !a.qaGatekeeperSigned);
  const isQaLocked = unsignedQaAssets.length > 0;

  return (
    <div className="relative w-full rounded-2xl bg-[#121620] border border-white/[0.08] p-5 lg:p-6 shadow-2xl overflow-hidden">
      {/* Background Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 70% 30%, rgba(0, 229, 153, 0.05) 0%, transparent 60%),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px'
        }}
      />

      {/* Header & Persona Filter */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                RACI Boundary Gatekeeper & Approval Conduit
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00E599]/15 border border-[#00E599]/30 text-[10px] font-mono font-bold text-[#00E599]">
                STRICT VETO ENFORCEMENT
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE]">
              Eliminates scope confusion: distinguishes who Decides (Accountable) from who Executes (Responsible)
            </p>
          </div>
        </div>

        {/* Role Lens Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8F9CAE] mr-1 hidden sm:inline">Role Filter:</span>
          
          <button
            type="button"
            onClick={() => setActivePersonaFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activePersonaFilter === 'ALL'
                ? 'bg-white text-[#0B0E14]'
                : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
            }`}
          >
            All RACI Roles
          </button>

          <button
            type="button"
            onClick={() => setActivePersonaFilter('CONTENT_MANAGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activePersonaFilter === 'CONTENT_MANAGER'
                ? 'bg-[#00E599] text-[#0B0E14]'
                : 'bg-[#181E2C] text-[#00E599] hover:bg-[#00E599]/15 border border-[#00E599]/30'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Content Managers</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePersonaFilter('CREATIVE_SPECIALIST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activePersonaFilter === 'CREATIVE_SPECIALIST'
                ? 'bg-[#C084FC] text-[#0B0E14]'
                : 'bg-[#181E2C] text-[#C084FC] hover:bg-[#C084FC]/15 border border-[#C084FC]/30'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Creative Specialists</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePersonaFilter('DISTRIBUTION_LEAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activePersonaFilter === 'DISTRIBUTION_LEAD'
                ? 'bg-[#38BDF8] text-[#0B0E14]'
                : 'bg-[#181E2C] text-[#38BDF8] hover:bg-[#38BDF8]/15 border border-[#38BDF8]/30'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Distribution Leads</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePersonaFilter('STAKEHOLDER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activePersonaFilter === 'STAKEHOLDER'
                ? 'bg-[#F5A524] text-[#0B0E14]'
                : 'bg-[#181E2C] text-[#F5A524] hover:bg-[#F5A524]/15 border border-[#F5A524]/30'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Stakeholders</span>
          </button>
        </div>
      </div>

      {/* 5 Horizontal Gateway Chambers */}
      <div className="relative z-10 py-5 space-y-4">
        {RACI_CHAMBERS.map((chamber) => {
          const isCmAccountable = chamber.accountableRole === 'CONTENT_MANAGER';
          const isFilterActive = activePersonaFilter !== 'ALL';
          const isAccountableInFilter = isFilterActive && chamber.accountableRole === activePersonaFilter;
          const isResponsibleInFilter = isFilterActive && chamber.responsibleRoles.includes(activePersonaFilter);
          const isDimmed = isFilterActive && !isAccountableInFilter && !isResponsibleInFilter;

          // Chamber highlight styling
          let borderStyle = 'border-white/[0.08]';
          let bgStyle = 'bg-[#181E2C]';

          if (isAccountableInFilter) {
            borderStyle = 'border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.15)]';
            bgStyle = 'bg-[#181E2C]/90';
          } else if (isResponsibleInFilter) {
            borderStyle = 'border-[#C084FC] shadow-[0_0_20px_rgba(192,132,252,0.15)]';
          } else if (isDimmed) {
            bgStyle = 'bg-[#181E2C]/40 opacity-40';
          }

          return (
            <div
              key={chamber.id}
              className={`rounded-xl p-4 sm:p-5 border transition-all duration-300 ${borderStyle} ${bgStyle}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Stage Title & Gate Lock */}
                <div className="flex items-center gap-3.5 sm:min-w-[280px]">
                  <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#8F9CAE]">
                    0{chamber.stageNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {chamber.name}
                      </h3>
                      {chamber.isGatekeeperLock && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isQaLocked 
                            ? 'bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/30' 
                            : 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30'
                        }`}>
                          {isQaLocked ? (
                            <>
                              <Lock className="h-3 w-3 animate-pulse" />
                              <span>LOCKED ({unsignedQaAssets.length})</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3" />
                              <span>UNLOCKED</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8F9CAE] mt-0.5">
                      {chamber.isGatekeeperLock 
                        ? 'Requires 4-point verification check sign-off by Content Manager role before release'
                        : 'Structured RACI handoff boundary to prevent scope drift'}
                    </p>
                  </div>
                </div>

                {/* Right: 4 RACI Quadrants */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 max-w-3xl">
                  {/* Accountable (A) */}
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    isAccountableInFilter
                      ? 'bg-[#00E599]/20 border-[#00E599] text-[#00E599]'
                      : 'bg-[#121620] border-white/5 text-[#8F9CAE]'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[#00E599]">A • DECIDES</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                    </div>
                    <span className="text-xs font-semibold text-white mt-1 line-clamp-1">
                      {chamber.accountableLabel}
                    </span>
                  </div>

                  {/* Responsible (R) */}
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    isResponsibleInFilter
                      ? 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC]'
                      : 'bg-[#121620] border-white/5 text-[#8F9CAE]'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[#C084FC]">R • EXECUTES</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C084FC]" />
                    </div>
                    <span className="text-xs font-semibold text-white mt-1 line-clamp-1">
                      {chamber.responsibleLabel}
                    </span>
                  </div>

                  {/* Consulted (C) */}
                  <div className="p-2.5 rounded-lg bg-[#121620] border border-white/5 text-[#8F9CAE] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[#F5A524]">C • INPUT</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F5A524]" />
                    </div>
                    <span className="text-xs font-medium text-white/90 mt-1 line-clamp-1">
                      {chamber.consultedLabel}
                    </span>
                  </div>

                  {/* Informed (I) */}
                  <div className="p-2.5 rounded-lg bg-[#121620] border border-white/5 text-[#8F9CAE] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[#38BDF8]">I • UPDATED</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                    </div>
                    <span className="text-xs font-medium text-white/90 mt-1 line-clamp-1">
                      {chamber.informedLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8F9CAE]">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#00E599]" />
          <span>RACI Governance Rule: Exactly 1 single Accountable owner per stage guarantees zero diffusion of responsibility.</span>
        </div>
        <span className="font-mono text-[11px] text-white">4-POINT QA VETO: ACTIVE</span>
      </div>
    </div>
  );
};
