import React from 'react';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Creation & Core Actions',
    items: [
      {
        keys: ['N'],
        label: 'New Asset Brief',
        description: 'Open the New Brief intake studio modal'
      },
      {
        keys: ['S'],
        label: 'Focus Search Bar',
        description: 'Jump to the Kanban search bar and open recent queries'
      },
      {
        keys: ['M'],
        label: 'Asset Multiplier',
        description: 'Launch 1-to-N derivative splitter for HERO assets'
      },
      {
        keys: ['D'],
        label: 'Velocity & SLA Dashboard',
        description: 'Toggle 30-day velocity trends and SLA performance metrics'
      }
    ]
  },
  {
    title: 'Pipeline & Governance Filters',
    items: [
      {
        keys: ['1'],
        label: 'All Pipeline',
        description: 'Reset tier and quick filters to view all active assets'
      },
      {
        keys: ['2'],
        label: 'HERO Tier Only',
        description: 'Filter board to flagship HERO productions'
      },
      {
        keys: ['3'],
        label: 'HUB Series Only',
        description: 'Filter board to episodic HUB content'
      },
      {
        keys: ['4'],
        label: 'HYGIENE Tier Only',
        description: 'Filter board to always-on HYGIENE assets'
      },
      {
        keys: ['Q'],
        label: 'Needs My Sign-off',
        description: 'Toggle Stage 4 QA Gate filter for Content Managers'
      },
      {
        keys: ['R'],
        label: 'SLA Risk Radar',
        description: 'Toggle filter for SLA timers < 12h or breached'
      }
    ]
  },
  {
    title: 'Workspace & System Overlays',
    items: [
      {
        keys: ['⌘', '/'],
        label: 'Keyboard Shortcuts Help',
        description: 'Toggle this command reference overlay (or Ctrl + /)'
      },
      {
        keys: [','],
        label: 'AI Engine Settings',
        description: 'Open IFM.ai K2 Horizon configuration modal'
      },
      {
        keys: ['Esc'],
        label: 'Dismiss / Blur',
        description: 'Close active modal drawer or unfocus search input'
      }
    ]
  }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#121620] border border-white/[0.1] shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#181E2C] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 border border-[#00E599]/40 flex items-center justify-center text-[#00E599]">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="keyboard-shortcuts-title" className="text-base font-bold text-white tracking-tight">
                  Global Keyboard Shortcuts
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-mono text-[10px] font-semibold">
                  ⌘ + /
                </span>
              </div>
              <p className="text-xs text-[#8F9CAE] mt-0.5">
                Navigate Thrill ContentOps at high velocity without leaving your keyboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts overlay"
            className="h-8 w-8 rounded-lg bg-[#121620] hover:bg-white/10 border border-white/[0.07] text-[#8F9CAE] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#00E599]">
                  {category.title}
                </h3>
                <div className="h-px flex-1 bg-white/[0.06] ml-3" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {category.items.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl bg-[#181E2C] border border-white/[0.07] hover:border-[#00E599]/30 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#8F9CAE] line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((key, idx) => (
                        <React.Fragment key={key}>
                          <kbd className="min-w-[26px] h-6 px-2 rounded-md bg-[#0B0E14] border border-white/15 text-[#00E599] font-mono text-xs font-bold flex items-center justify-center shadow-inner">
                            {key}
                          </kbd>
                          {idx < item.keys.length - 1 && (
                            <span className="text-[10px] text-[#8F9CAE] font-mono">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#181E2C] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8F9CAE]">
          <div className="flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5 text-[#00E599]" />
            <span>Single-key shortcuts are automatically disabled while typing in text fields.</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Sparkles className="h-3 w-3 text-[#00E599]" />
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#0B0E14] border border-white/10 text-white">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
