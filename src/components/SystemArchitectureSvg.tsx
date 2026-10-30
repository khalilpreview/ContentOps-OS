import React from 'react';
import { ShieldCheck, Cpu, Clock, GitFork, CheckCircle2, Sparkles, Layers } from 'lucide-react';

export const SystemArchitectureSvg: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top System Status Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#181a24] border border-[#252837] text-[11px] font-mono text-[#8b93a7]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ff8ac]"></span>
          </span>
          <span className="text-white font-semibold tracking-wide">STATE ENGINE: ONLINE</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[#4ff8ac] font-bold">RACI VETO: ACTIVE</span>
          <span className="text-[#252837]">|</span>
          <span className="text-amber-400 font-bold">SLA CLOCKS: 48H</span>
          <span className="text-[#252837]">|</span>
          <span className="text-indigo-400 font-bold">K2 HORIZON: SYNCED</span>
        </div>
      </div>

      {/* Main Architecture Graphic Card */}
      <div className="relative rounded-3xl bg-[#13151c] border border-[#252837] p-4 sm:p-5 shadow-2xl overflow-hidden">
        {/* Subtle dot matrix background */}
        <div className="absolute inset-0 bg-[radial-gradient(#252837_1px,transparent_1px)] [background-size:18px_18px] opacity-40 pointer-events-none" />

        {/* Header inside graphic */}
        <div className="relative z-10 flex items-center justify-between mb-4 border-b border-[#252837] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#4ff8ac]/15 text-[#4ff8ac] border border-[#4ff8ac]/30 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Deterministic ContentOps Pipeline</span>
                <span className="text-[9px] font-mono font-normal px-2 py-0.5 rounded-md bg-[#181a24] text-[#4ff8ac] border border-[#252837]">
                  Strict State Machine
                </span>
              </h3>
              <p className="text-[10px] text-[#8b93a7] font-sans">
                RACI governance eliminates scope creep; SLA timers prevent turnaround bottlenecks.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#4ff8ac] hidden sm:inline">
            SYSTEM_SPEC_MVP.md
          </span>
        </div>

        {/* SVG Diagram Canvas */}
        <svg
          viewBox="0 0 680 435"
          className="w-full h-auto select-none relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="neonMint" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ff8ac" />
              <stop offset="100%" stopColor="#38ef98" />
            </linearGradient>
            <linearGradient id="neonAmber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#4ff8ac" />
            </linearGradient>
            <linearGradient id="boxBgNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#181a24" />
              <stop offset="100%" stopColor="#10121a" />
            </linearGradient>
          </defs>

          {/* Connectors / Flow Lines */}
          <path d="M 125 95 L 175 95" stroke="url(#neonMint)" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="173,92 180,95 173,98" fill="#4ff8ac" />

          <path d="M 280 95 L 330 95" stroke="url(#neonAmber)" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="328,92 335,95 328,98" fill="#f59e0b" />

          <path d="M 435 95 L 485 95" stroke="url(#neonMint)" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="483,92 490,95 483,98" fill="#4ff8ac" />

          <path d="M 590 95 L 625 95" stroke="#4ff8ac" strokeWidth="2" />
          <polygon points="623,92 630,95 623,98" fill="#4ff8ac" />

          {/* Rejection / Request Edits loop back */}
          <path
            d="M 540 155 Q 540 185, 385 185 Q 230 185, 230 155"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.8"
          />
          <text x="385" y="198" fill="#f87171" fontSize="9" fontFamily="monospace" textAnchor="middle">
            VETO / Revision Loop (Rejection to Production)
          </text>

          {/* Multiplier Branch Wire */}
          <path
            d="M 540 95 L 540 235 L 340 235 L 340 260"
            fill="none"
            stroke="#4ff8ac"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            opacity="0.85"
          />
          <path
            d="M 340 260 L 155 295 M 340 260 L 340 295 M 340 260 L 525 295"
            fill="none"
            stroke="#4ff8ac"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* ================= 5 PIPELINE NODES ================= */}

          {/* NODE 1: Draft Brief */}
          <g transform="translate(20, 35)">
            <rect width="105" height="120" rx="14" fill="url(#boxBgNavy)" stroke="#252837" strokeWidth="1.5" />
            <rect x="10" y="8" width="85" height="16" rx="6" fill="#1e212e" />
            <text x="52" y="19" fill="#4ff8ac" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              STAGE 1: BRIEF
            </text>
            <circle cx="52" cy="46" r="14" fill="#13151c" stroke="#4ff8ac" strokeWidth="1" />
            <path d="M 48 42 L 56 46 L 48 50 Z" fill="#4ff8ac" />
            <text x="52" y="74" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              K2 Horizon AI
            </text>
            <text x="52" y="86" fill="#8b93a7" fontSize="7.5" textAnchor="middle">
              Auto-Briefing
            </text>
            <rect x="12" y="94" width="81" height="18" rx="6" fill="#10121a" stroke="#252837" strokeWidth="1" />
            <text x="52" y="106" fill="#4ff8ac" fontSize="7" fontFamily="monospace" textAnchor="middle">
              3 Hooks & Specs
            </text>
          </g>

          {/* NODE 2: SLA Review */}
          <g transform="translate(175, 35)">
            <rect width="105" height="120" rx="14" fill="url(#boxBgNavy)" stroke="#252837" strokeWidth="1.5" />
            <rect x="10" y="8" width="85" height="16" rx="6" fill="#451a03" />
            <text x="52" y="19" fill="#fef08a" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              STAGE 2: SLA
            </text>
            <circle cx="52" cy="46" r="14" fill="#13151c" stroke="#f59e0b" strokeWidth="1" />
            <circle cx="52" cy="46" r="7" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 52 42 L 52 46 L 55 46" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
            <text x="52" y="74" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              SLA Clock
            </text>
            <text x="52" y="86" fill="#8b93a7" fontSize="7.5" textAnchor="middle">
              Stakeholder Gate
            </text>
            <rect x="12" y="94" width="81" height="18" rx="6" fill="#451a03" />
            <text x="52" y="106" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              ⏱ 48h Countdown
            </text>
          </g>

          {/* NODE 3: Production Pod */}
          <g transform="translate(330, 35)">
            <rect width="105" height="120" rx="14" fill="url(#boxBgNavy)" stroke="#252837" strokeWidth="1.5" />
            <rect x="10" y="8" width="85" height="16" rx="6" fill="#1e212e" />
            <text x="52" y="19" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              STAGE 3: POD
            </text>
            <circle cx="52" cy="46" r="14" fill="#13151c" stroke="#3b82f6" strokeWidth="1" />
            <rect x="47" y="41" width="10" height="10" rx="2" fill="none" stroke="#93c5fd" strokeWidth="1.2" />
            <text x="52" y="74" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              Production
            </text>
            <text x="52" y="86" fill="#8b93a7" fontSize="7.5" textAnchor="middle">
              Creative Specialist
            </text>
            <rect x="12" y="94" width="81" height="18" rx="6" fill="#10121a" stroke="#252837" strokeWidth="1" />
            <text x="52" y="106" fill="#60a5fa" fontSize="7" fontFamily="monospace" textAnchor="middle">
              Deliverable URL
            </text>
          </g>

          {/* NODE 4: QA Gatekeeper VETO */}
          <g transform="translate(485, 35)">
            <rect width="105" height="120" rx="14" fill="url(#boxBgNavy)" stroke="#4ff8ac" strokeWidth="1.8" />
            <rect x="10" y="8" width="85" height="16" rx="6" fill="#064e3b" />
            <text x="52" y="19" fill="#4ff8ac" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              STAGE 4: QA VETO
            </text>
            <circle cx="52" cy="46" r="14" fill="#13151c" stroke="#4ff8ac" strokeWidth="1.2" />
            <path d="M 52 39 L 58 42 C 58 48 52 53 52 53 C 52 53 46 48 46 42 Z" fill="none" stroke="#4ff8ac" strokeWidth="1.3" />
            <text x="52" y="74" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              QA Gatekeeper
            </text>
            <text x="52" y="86" fill="#8b93a7" fontSize="7.5" textAnchor="middle">
              Content Manager Only
            </text>
            <rect x="12" y="94" width="81" height="18" rx="6" fill="#042f2e" stroke="#14b8a6" strokeWidth="1" />
            <text x="52" y="106" fill="#4ff8ac" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              3 Checks + Sign-Off
            </text>
          </g>

          {/* NODE 5: Final Hand-Off */}
          <g transform="translate(625, 35)">
            <rect width="45" height="120" rx="14" fill="url(#boxBgNavy)" stroke="#4ff8ac" strokeWidth="1.5" />
            <text x="22" y="65" fill="#4ff8ac" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 22 65)">
              PUBLISH
            </text>
          </g>

          {/* ================= ASSET MULTIPLIER SECTION ================= */}
          <g transform="translate(20, 260)">
            {/* Multiplier Central Hub */}
            <rect width="640" height="155" rx="18" fill="url(#boxBgNavy)" stroke="#252837" strokeWidth="1.5" />
            
            {/* Header pill */}
            <rect x="200" y="8" width="240" height="22" rx="11" fill="#1e212e" stroke="#252837" />
            <text x="320" y="23" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              ASSET MULTIPLIER ENGINE (HERO TIER)
            </text>

            <text x="320" y="42" fill="#8b93a7" fontSize="8.5" textAnchor="middle">
              1 Macro Hero Asset ➔ 3 Derivative Micro Assets Auto-Inheriting Metadata
            </text>

            {/* 3 Derivative Child Boxes */}
            {/* Child 1: 9:16 Short Video */}
            <g transform="translate(20, 52)">
              <rect width="186" height="88" rx="12" fill="#13151c" stroke="#252837" strokeWidth="1.2" />
              <rect x="12" y="10" width="40" height="16" rx="6" fill="#4ff8ac" opacity="0.15" />
              <text x="32" y="21" fill="#4ff8ac" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                DERIVATIVE 1
              </text>
              <text x="12" y="42" fill="#ffffff" fontSize="10" fontWeight="bold">
                9:16 Vertical Cut
              </text>
              <text x="12" y="56" fill="#8b93a7" fontSize="8">
                TikTok, Reels, YT Shorts Specs
              </text>
              <text x="12" y="70" fill="#4ff8ac" fontSize="8" fontFamily="monospace">
                ↳ Hook Angle #1 Auto-Inherited
              </text>
            </g>

            {/* Child 2: 10-Slide Carousel */}
            <g transform="translate(226, 52)">
              <rect width="186" height="88" rx="12" fill="#13151c" stroke="#252837" strokeWidth="1.2" />
              <rect x="12" y="10" width="40" height="16" rx="6" fill="#f59e0b" opacity="0.15" />
              <text x="32" y="21" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                DERIVATIVE 2
              </text>
              <text x="12" y="42" fill="#ffffff" fontSize="10" fontWeight="bold">
                10-Slide Deck Carousel
              </text>
              <text x="12" y="56" fill="#8b93a7" fontSize="8">
                LinkedIn & Instagram Slides
              </text>
              <text x="12" y="70" fill="#fbbf24" fontSize="8" fontFamily="monospace">
                ↳ Hook Angle #2 Auto-Inherited
              </text>
            </g>

            {/* Child 3: Thought Leadership Article */}
            <g transform="translate(432, 52)">
              <rect width="186" height="88" rx="12" fill="#13151c" stroke="#252837" strokeWidth="1.2" />
              <rect x="12" y="10" width="40" height="16" rx="6" fill="#3b82f6" opacity="0.15" />
              <text x="32" y="21" fill="#93c5fd" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                DERIVATIVE 3
              </text>
              <text x="12" y="42" fill="#ffffff" fontSize="10" fontWeight="bold">
                Executive Article
              </text>
              <text x="12" y="56" fill="#8b93a7" fontSize="8">
                Newsletter & Substack Editorial
              </text>
              <text x="12" y="70" fill="#93c5fd" fontSize="8" fontFamily="monospace">
                ↳ Hook Angle #3 Auto-Inherited
              </text>
            </g>
          </g>
        </svg>

        {/* RACI Matrix Bottom Summary */}
        <div className="mt-3 pt-3 border-t border-[#252837] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#181a24] border border-[#252837]">
            <span className="font-bold text-[#4ff8ac]">A</span>
            <span className="text-[#8b93a7]">Content Mgr (Gatekeeper)</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#181a24] border border-[#252837]">
            <span className="font-bold text-blue-400">R</span>
            <span className="text-[#8b93a7]">Creative Specialist (Doer)</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#181a24] border border-[#252837]">
            <span className="font-bold text-amber-400">C</span>
            <span className="text-[#8b93a7]">Stakeholder (Reviewer)</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#181a24] border border-[#252837]">
            <span className="font-bold text-emerald-400">I</span>
            <span className="text-[#8b93a7]">Distribution Lead (SMM)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
