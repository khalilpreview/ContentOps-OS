import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Globe, 
  RotateCcw, 
  Save, 
  ShieldCheck
} from 'lucide-react';
import { AiConfig, getStoredAiConfig, saveStoredAiConfig } from '../lib/aiService';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  onResetData
}) => {
  const [config, setConfig] = useState<AiConfig>({
    apiKey: '',
    baseUrl: 'https://api.ifm.ai/v1',
    model: 'k2-horizon'
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredAiConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredAiConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00E599]/15 text-[#00E599] flex items-center justify-center border border-[#00E599]/40">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Engine &amp; Pipeline Settings
              </h2>
              <p className="text-xs text-[#8F9CAE]">
                IFM.ai K2 Horizon runtime &amp; seed data controls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
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
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
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
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="k2-horizon"
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00E599] hover:bg-[#00cc88] text-[#0B0E14] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 mt-2 border-t border-white/[0.07] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Reset Pipeline Data</span>
              <span className="text-[11px] text-[#8F9CAE]">
                Restores original 8 active assets + 1 archived asset across all stages
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
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
