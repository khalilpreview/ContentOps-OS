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
      <div className="bg-[#13151c] border border-rose-500/50 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isVetoBlock ? 'RACI Gatekeeper VETO' : 'Pipeline Transition Blocked'}</span>
              </h3>
              <p className="text-xs text-[#8b93a7] font-mono">
                Deterministic State Machine Guard Enforced
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
            aria-label="Close Notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transition context pill */}
        {sourceStatus && targetStatus && (
          <div className="flex items-center gap-2 text-xs font-mono bg-[#10121a] px-3.5 py-2 rounded-xl border border-[#252837] text-[#8b93a7]">
            <span className="text-white">{sourceStatus}</span>
            <ArrowRight className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[#4ff8ac] font-bold">{targetStatus}</span>
          </div>
        )}

        {/* Reason Box */}
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 text-xs text-rose-200 space-y-2 whitespace-pre-line leading-relaxed">
          {reason}
        </div>

        {/* Active persona status */}
        <div className="p-3.5 rounded-2xl bg-[#181a24] border border-[#252837] text-xs flex items-center justify-between">
          <span className="text-[#8b93a7]">Current Session Persona:</span>
          <span className="font-bold text-white">
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
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
            >
              Open Asset Studio
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-colors"
          >
            Acknowledge Guard
          </button>
        </div>
      </div>
    </div>
  );
};
