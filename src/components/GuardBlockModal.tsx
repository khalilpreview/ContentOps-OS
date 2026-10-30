import React from 'react';
import { AlertOctagon, X, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { AssetStatus, ContentAsset, User } from '../types';

interface GuardBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  sourceStatus?: AssetStatus;
  targetStatus?: AssetStatus;
  assetTitle?: string;
  currentUser: User;
  onOpenDetail?: () => void;
}

export const GuardBlockModal: React.FC<GuardBlockModalProps> = ({
  isOpen,
  onClose,
  reason,
  sourceStatus,
  targetStatus,
  assetTitle,
  currentUser,
  onOpenDetail
}) => {
  if (!isOpen) return null;

  const isVetoBlock = reason.includes('VETO BLOCK');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-rose-500/50 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{isVetoBlock ? 'RACI Gatekeeper VETO' : 'Pipeline Transition Blocked'}</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Deterministic State Machine Guard Enforced
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close Notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transition context pill */}
        {sourceStatus && targetStatus && (
          <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
            <span className="text-zinc-400">{sourceStatus}</span>
            <ArrowRight className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-zinc-100 font-semibold">{targetStatus}</span>
          </div>
        )}

        {/* Reason Box */}
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 text-xs text-rose-200 space-y-2 whitespace-pre-line leading-relaxed">
          {reason}
        </div>

        {/* Active persona status */}
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
          <span className="text-zinc-400">Current Session Persona:</span>
          <span className="font-semibold text-zinc-200">
            {currentUser.name} ({currentUser.role})
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onOpenDetail && (
            <button
              onClick={() => {
                onClose();
                onOpenDetail();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              Open Asset Studio
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          >
            Acknowledge Guard
          </button>
        </div>
      </div>
    </div>
  );
};
