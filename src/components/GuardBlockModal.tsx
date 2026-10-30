import React from 'react';
import { X, ShieldAlert, ArrowRight } from 'lucide-react';
import { AssetStatus, User } from '../types';

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
  currentUser,
  onOpenDetail
}) => {
  if (!isOpen) return null;

  const isVetoBlock = reason.includes('VETO BLOCK');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181E2C] border border-[#FF4B55]/50 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isVetoBlock ? 'RACI Gatekeeper VETO' : 'Pipeline Transition Blocked'}</span>
              </h3>
              <p className="text-xs text-[#8F9CAE] font-mono">
                Governance: Approval Lock Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#121620] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
            aria-label="Close Notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transition context pill */}
        {sourceStatus && targetStatus && (
          <div className="flex items-center gap-2 text-xs font-mono bg-[#121620] px-3.5 py-2 rounded-lg border border-white/[0.07] text-[#8F9CAE]">
            <span className="text-white">{sourceStatus}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#FF4B55]" />
            <span className="text-[#00E599] font-bold">{targetStatus}</span>
          </div>
        )}

        {/* Reason Box */}
        <div className="bg-[#FF4B55]/10 border border-[#FF4B55]/40 rounded-xl p-4 text-xs text-white space-y-2 whitespace-pre-line leading-relaxed">
          {reason}
        </div>

        {/* Active persona status */}
        <div className="p-3.5 rounded-xl bg-[#121620] border border-white/[0.07] text-xs flex items-center justify-between">
          <span className="text-[#8F9CAE]">Active RACI Role:</span>
          <span className="font-bold text-white">
            {currentUser.name} ({currentUser.role})
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onOpenDetail && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDetail();
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#121620] hover:bg-[#1E2536] text-white border border-white/[0.07] transition-colors cursor-pointer"
            >
              Open Asset Studio
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF4B55] hover:bg-[#ff333f] text-white transition-colors cursor-pointer"
          >
            Acknowledge Veto
          </button>
        </div>
      </div>
    </div>
  );
};
