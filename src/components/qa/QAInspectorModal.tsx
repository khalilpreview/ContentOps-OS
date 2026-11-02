import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Send,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  User as UserIcon,
  HelpCircle,
  FileText,
  Smartphone,
  Tv,
  Layers,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music,
  ExternalLink,
  ChevronRight,
  Radio,
  Check,
  Film,
  Image as ImageIcon,
  Sliders,
  History as HistoryIcon
} from 'lucide-react';
import { AssetStatus, ContentAsset, User, FormatTier } from '../../types';
import {
  canSignOffQa,
  formatPlaybackTime,
  isVideoDeliverable,
  isImageDeliverable,
  createRevisionPayload
} from './qaValidation';

interface QAInspectorModalProps {
  asset: ContentAsset;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onUpdateAsset: (asset: ContentAsset) => void;
  onTransitionAsset: (asset: ContentAsset, targetStatus: AssetStatus) => void;
  onOpenGeneralStudio?: (asset: ContentAsset) => void;
}

// Fallback demo assets for interactive testing
const DEMO_PRESETS = [
  {
    name: '9:16 Vertical Video (Demo Reel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video'
  },
  {
    name: '16:9 4K Studio Cut (MP4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    type: 'video'
  },
  {
    name: 'High-Res Keyframe Poster (Image)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    type: 'image'
  }
];

export const QAInspectorModal: React.FC<QAInspectorModalProps> = ({
  asset,
  currentUser,
  allUsers,
  onClose,
  onUpdateAsset,
  onTransitionAsset,
  onOpenGeneralStudio
}) => {
  // Local state for active deliverable URL (allows switching between asset URL and test presets)
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>(() => {
    return asset.deliverableUrl || DEMO_PRESETS[0].url;
  });

  // Safe zones overlay toggle (TikTok & Instagram Reels overlay guidelines)
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);

  // Framing: 9:16 Phone Mockup Bezel vs Wide Contain
  const [framingMode, setFramingMode] = useState<'phone' | 'contain'>('phone');

  // Video playback controls state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Image zoom controls state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Revision Feedback Drawer state
  const [isRevisionDrawerOpen, setIsRevisionDrawerOpen] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const feedbackInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [revisionToast, setRevisionToast] = useState<string | null>(null);

  // Sign-off success animation state
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);

  // Assigned creative
  const assignee = allUsers.find((u) => u.id === asset.assignedToId) || {
    id: 'u-cs',
    name: 'Marcus Vance',
    role: 'CREATIVE_SPECIALIST' as const,
    email: 'marcus@thrill.ai'
  };

  // Detect whether active media is video or image
  const isVideo = isVideoDeliverable(activeMediaUrl);
  const isImage = isImageDeliverable(activeMediaUrl);

  // Evaluate QA Gatekeeper sign-off eligibility
  const signOffCheck = canSignOffQa(asset, currentUser);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  // Video time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Timeline scrubber change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Change Playback Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toggle Fullscreen on video container
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut: Space toggles video play/pause when drawer is not active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRevisionDrawerOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && isVideo) {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        if (isRevisionDrawerOpen) {
          setIsRevisionDrawerOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isVideo, isRevisionDrawerOpen, onClose]);

  // Handle inserting current video timestamp into feedback notes
  const handleInsertTimestamp = () => {
    const formatted = formatPlaybackTime(currentTime);
    const timeSnippet = `At ${formatted}: `;
    setFeedbackNote((prev) => {
      if (!prev) return timeSnippet;
      return prev.endsWith('\n') ? `${prev}${timeSnippet}` : `${prev}\n${timeSnippet}`;
    });
    setTimeout(() => {
      feedbackInputRef.current?.focus();
    }, 50);
  };

  // Toggle binary QA checks
  const handleToggleCheck = (checkKey: 'qaToneApproved' | 'qaSpecsValidated' | 'qaRightsCleared' | 'qaGatekeeperSigned') => {
    // Only CONTENT_MANAGER can toggle qaGatekeeperSigned
    if (checkKey === 'qaGatekeeperSigned' && currentUser.role !== 'CONTENT_MANAGER') {
      return;
    }

    const updated: ContentAsset = {
      ...asset,
      [checkKey]: !asset[checkKey],
      updatedAt: new Date().toISOString()
    };

    // If gatekeeper is signing off now, record identity
    if (checkKey === 'qaGatekeeperSigned') {
      if (!asset.qaGatekeeperSigned) {
        updated.qaSignedById = currentUser.id;
        updated.qaSignedByName = currentUser.name;
        updated.qaSignedAt = new Date().toISOString();
      } else {
        updated.qaSignedById = null;
        updated.qaSignedByName = null;
        updated.qaSignedAt = null;
      }
    }

    onUpdateAsset(updated);
  };

  // Submit Revision and Revert to Stage 3 (IN_PRODUCTION)
  const handleSubmitRevision = () => {
    if (!feedbackNote.trim()) return;

    const payload = createRevisionPayload(asset, currentUser, feedbackNote, currentTime);
    const updatedAsset: ContentAsset = {
      ...asset,
      ...payload
    };

    onUpdateAsset(updatedAsset);
    onTransitionAsset(asset, 'IN_PRODUCTION');

    setRevisionToast(`Revision feedback submitted to ${assignee.name}. Card reverted to Stage 3.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Submit Final Sign-off and Advance to Stage 5 (READY_TO_PUBLISH)
  const handleFinalSignOff = () => {
    if (!signOffCheck.canSignOff) return;

    setIsSigningOff(true);
    const nowIso = new Date().toISOString();
    const updated: ContentAsset = {
      ...asset,
      status: 'READY_TO_PUBLISH',
      qaGatekeeperSigned: true,
      qaSignedById: currentUser.id,
      qaSignedByName: currentUser.name,
      qaSignedAt: nowIso,
      updatedAt: nowIso,
      history: [
        ...(asset.history || []),
        {
          id: `qa-signoff-${Date.now()}`,
          action: 'QA_GATE_CLEARED',
          fromStatus: 'QA_GATE',
          toStatus: 'READY_TO_PUBLISH',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: nowIso,
          note: 'Approved 4-point QA checklist: Tone, Safe Zones, Rights & Gatekeeper clearance.'
        }
      ]
    };

    onUpdateAsset(updated);
    onTransitionAsset(asset, 'READY_TO_PUBLISH');

    setTimeout(() => {
      setIsSigningOff(false);
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Modal Container */}
      <div className="w-full h-full max-w-[1700px] max-h-[96vh] bg-[#0B0E14] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* ======================================================== */}
        {/* Top Header Bar */}
        {/* ======================================================== */}
        <header className="h-16 px-6 bg-[#121620] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Stage Indicator Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#00E599]/15 border border-[#00E599]/40 rounded-lg text-[#00E599] text-xs font-mono font-bold tracking-wider shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#00E599]" />
              <span>STAGE 4 • QA GATEKEEPER</span>
            </div>

            {/* Format Tier Badge */}
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wide shrink-0 ${
                asset.formatTier === 'HERO'
                  ? 'bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/40'
                  : asset.formatTier === 'HUB'
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-white/10 text-[#8F9CAE] border border-white/10'
              }`}
            >
              {asset.formatTier}
            </span>

            {/* Asset Title */}
            <h2
              id="qa-modal-title"
              className="text-base sm:text-lg font-bold text-white truncate max-w-xl"
              title={asset.title}
            >
              {asset.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Active User Indicator */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-[#181E2C] border border-white/10 rounded-lg text-xs">
              <div className="w-6 h-6 rounded-full bg-[#00E599]/20 border border-[#00E599]/40 flex items-center justify-center text-[#00E599] font-bold text-[11px]">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <span className="text-white font-medium block leading-none">{currentUser.name}</span>
                <span className="text-[10px] text-[#8F9CAE] font-mono leading-none">
                  {currentUser.role === 'CONTENT_MANAGER' ? 'Content Manager (Gatekeeper)' : currentUser.role}
                </span>
              </div>
            </div>

            {/* Quick Switch to General Studio if available */}
            {onOpenGeneralStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGeneralStudio(asset);
                }}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#8F9CAE] hover:text-white border border-white/10 rounded-lg text-xs font-medium transition-all"
                title="Open full editable brief studio"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Brief Studio</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#8F9CAE] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close QA Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* Two-Column Workspace */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          
          {/* ------------------------------------------------------ */}
          {/* Left Column: Creative Brief Reference                 */}
          {/* ------------------------------------------------------ */}
          <aside className="w-full lg:w-[460px] xl:w-[500px] border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0E121B] flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 space-y-5">
              
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#8F9CAE] uppercase">
                  <FileText className="w-4 h-4 text-[#00E599]" />
                  <span>Creative Brief Reference</span>
                </div>
                <span className="text-[11px] text-[#00E599] bg-[#00E599]/10 px-2 py-0.5 rounded border border-[#00E599]/20 font-mono">
                  Spec Ground Truth
                </span>
              </div>

              {/* 1. Hook Angle & First 3-Seconds */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">1. Hook Strategy (First 3s)</span>
                  <span className="text-[10px] bg-[#00E599]/20 text-[#00E599] px-2 py-0.5 rounded-full font-mono font-bold">
                    Primary Hook
                  </span>
                </div>
                <p className="text-sm text-white font-medium leading-relaxed bg-[#181E2C] p-3 rounded-lg border border-white/5">
                  {asset.hookStrategy ||
                    (asset.generatedHooks && asset.generatedHooks[0]?.script) ||
                    'Hook angle specified in brief.'}
                </p>
                {asset.generatedHooks && asset.generatedHooks.length > 1 && (
                  <div className="pt-1 space-y-1">
                    <span className="text-[11px] text-[#8F9CAE]">Alternative Tested Hooks:</span>
                    {asset.generatedHooks.slice(1, 3).map((hook, idx) => (
                      <div key={idx} className="text-xs text-[#8F9CAE] italic pl-2 border-l-2 border-[#00E599]/40">
                        "{hook.script}"
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Target Audience & Persona */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">2. Target Audience</span>
                <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed">
                  {asset.targetAudience ||
                    'Enterprise ContentOps leaders, Creative Technologists, and PMs scaling automated short-form pipeline.'}
                </p>
              </div>

              {/* 3. Technical Platform Specs */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">3. Technical Specifications</span>
                  <span className="text-[10px] text-[#F5A524] bg-[#F5A524]/10 border border-[#F5A524]/30 px-2 py-0.5 rounded font-mono">
                    Mandatory QA Pass
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] block uppercase font-mono">Framing & Res</span>
                    <span className="text-white font-mono font-semibold">1080x1920 (9:16)</span>
                  </div>
                  <div className="bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] block uppercase font-mono">Frame Rate</span>
                    <span className="text-white font-mono font-semibold">60 fps (Smooth)</span>
                  </div>
                  <div className="bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] block uppercase font-mono">Audio Standard</span>
                    <span className="text-white font-mono font-semibold">-14 LUFS (Stereo)</span>
                  </div>
                  <div className="bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] block uppercase font-mono">Max Duration</span>
                    <span className="text-white font-mono font-semibold">58s (&lt; 60s)</span>
                  </div>
                </div>

                {asset.platformSpecs && (
                  <p className="text-xs text-[#8F9CAE] bg-[#181E2C]/50 p-2 rounded border border-white/5 font-mono">
                    {asset.platformSpecs}
                  </p>
                )}
              </div>

              {/* 4. Safe Zone Requirements */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">4. Safe Zone Requirements</span>
                  <button
                    type="button"
                    onClick={() => setShowSafeZones(!showSafeZones)}
                    className="flex items-center gap-1 text-[11px] text-[#00E599] hover:underline font-mono"
                  >
                    {showSafeZones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showSafeZones ? 'Overlay Visible' : 'Overlay Hidden'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00E599]" />
                    <span><strong>Top Clear Zone (120px):</strong> Search & Following tabs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00E599]" />
                    <span><strong>Bottom Clear Zone (180px):</strong> Captions & Sound disk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00E599]" />
                    <span><strong>Right Rail (80px):</strong> Like, Comment, Bookmark, Share</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8F9CAE] bg-[#181E2C] p-2.5 rounded-lg border border-white/5 italic">
                  {asset.safeZoneRequirements ||
                    'TikTok & IG Reels (9:16): Keep text, logos, and critical action within central 1080x1420px. Burnt-in captions must not collide with native platform engagement buttons.'}
                </p>
              </div>

              {/* 5. Target KPIs */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">5. Target KPIs</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] uppercase font-mono block">3s Retention</span>
                    <span className="text-sm font-bold text-[#00E599] font-mono">≥ 70%</span>
                  </div>
                  <div className="flex-1 bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#8F9CAE] uppercase font-mono block">Share / Save Rate</span>
                    <span className="text-sm font-bold text-white font-mono">&gt; 15%</span>
                  </div>
                </div>
                {asset.targetKpi && (
                  <p className="text-xs text-[#8F9CAE] italic">{asset.targetKpi}</p>
                )}
              </div>

              {/* 6. Creative Assignee & Raw Intake Notes */}
              <div className="bg-[#121620] border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wide text-[#8F9CAE]">Assigned Creative Pod</span>
                <div className="flex items-center justify-between bg-[#181E2C] p-2.5 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#00E599]/20 border border-[#00E599]/40 flex items-center justify-center text-xs font-bold text-[#00E599]">
                      {assignee.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-white block">{assignee.name}</span>
                      <span className="text-[10px] text-[#8F9CAE] font-mono">{assignee.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#8F9CAE] font-mono">
                    Owner
                  </span>
                </div>

                {asset.rawIntakeNotes && (
                  <div className="pt-2 text-xs text-[#8F9CAE]">
                    <span className="font-semibold text-white block mb-0.5">Intake Notes:</span>
                    <p className="line-clamp-3">{asset.rawIntakeNotes}</p>
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* ------------------------------------------------------ */}
          {/* Right Column: Deliverable Preview & Controls          */}
          {/* ------------------------------------------------------ */}
          <main className="flex-1 flex flex-col min-h-0 bg-[#0B0E14] relative overflow-hidden">
            
            {/* Deliverable Toolbar */}
            <div className="h-14 px-6 bg-[#121620]/60 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  {isVideo ? <Film className="w-4 h-4 text-[#00E599]" /> : <ImageIcon className="w-4 h-4 text-[#00E599]" />}
                  <span>Deliverable Preview:</span>
                </span>

                {/* Media Preset Quick Selector */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {DEMO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveMediaUrl(preset.url);
                        if (preset.type === 'video' && videoRef.current) {
                          videoRef.current.load();
                          setIsPlaying(false);
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-colors ${
                        activeMediaUrl === preset.url
                          ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40'
                          : 'bg-white/5 hover:bg-white/10 text-[#8F9CAE] border border-white/5'
                      }`}
                    >
                      {preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 9:16 Safe Zones Overlay Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    showSafeZones
                      ? 'bg-[#00E599]/20 text-[#00E599] border-[#00E599]/50'
                      : 'bg-white/5 text-[#8F9CAE] hover:text-white border-white/10'
                  }`}
                  title="Toggle TikTok & Instagram safe margins guide"
                >
                  {showSafeZones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">TikTok/IG Safe Zones</span>
                </button>

                {/* Framing Toggle: Phone Bezel vs Wide */}
                {isVideo && (
                  <button
                    type="button"
                    onClick={() => setFramingMode(framingMode === 'phone' ? 'contain' : 'phone')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#8F9CAE] hover:text-white border border-white/10 rounded-lg text-xs font-medium transition-colors"
                    title={framingMode === 'phone' ? 'Switch to wide view' : 'Switch to 9:16 phone framing'}
                  >
                    {framingMode === 'phone' ? <Smartphone className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{framingMode === 'phone' ? '9:16 Framing' : 'Wide View'}</span>
                  </button>
                )}

                {/* "Request Revision" Drawer Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsRevisionDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4B55]/15 hover:bg-[#FF4B55]/25 text-[#FF4B55] border border-[#FF4B55]/40 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Revision</span>
                </button>
              </div>
            </div>

            {/* Media Canvas Viewport */}
            <div
              ref={videoContainerRef}
              className="flex-1 min-h-0 bg-[#080A0F] flex items-center justify-center p-3 sm:p-6 overflow-hidden relative select-none"
            >
              
              {/* VIDEO PLAYER RENDER */}
              {isVideo ? (
                <div
                  className={`relative flex items-center justify-center transition-all ${
                    framingMode === 'phone'
                      ? 'w-[320px] sm:w-[350px] md:w-[380px] h-[580px] sm:h-[630px] md:h-[680px] rounded-[36px] border-[6px] border-[#1E2536] shadow-2xl bg-black overflow-hidden ring-1 ring-white/10'
                      : 'w-full h-full max-w-4xl max-h-[75vh] rounded-xl overflow-hidden bg-black'
                  }`}
                >
                  {/* HTML5 Video Element */}
                  <video
                    ref={videoRef}
                    src={activeMediaUrl}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    playsInline
                    loop
                  />

                  {/* Play Overlay Button (Centered when paused) */}
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-[#00E599]/90 text-white hover:text-black border border-white/20 flex items-center justify-center transition-colors shadow-lg z-20 backdrop-blur-sm"
                      aria-label="Play video"
                    >
                      <Play className="w-8 h-8 ml-1 fill-current" />
                    </button>
                  )}

                  {/* =================================================== */}
                  {/* TIKTOK / INSTAGRAM SAFE ZONES REALISTIC OVERLAY    */}
                  {/* =================================================== */}
                  {showSafeZones && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 select-none">
                      
                      {/* Top Bar: Phone header & Search */}
                      <div className="w-full pt-2 px-2 flex items-center justify-between text-white/90 drop-shadow-md">
                        <span className="text-[11px] font-mono font-bold tracking-tight">9:41</span>
                        <div className="flex items-center gap-3 text-xs font-semibold">
                          <span className="opacity-75">Following</span>
                          <span className="border-b-2 border-white pb-0.5">For You</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5 text-white/80" />
                        </div>
                      </div>

                      {/* Center Dashed Safe Boundary Guide */}
                      <div className="absolute inset-x-4 top-[100px] bottom-[150px] border-2 border-dashed border-[#00E599]/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <span className="text-[9px] font-mono text-[#00E599] bg-black/75 px-1.5 py-0.5 rounded self-start border border-[#00E599]/40">
                          SAFE ZONE (Keep copy & hooks inside)
                        </span>
                        <span className="text-[9px] font-mono text-[#00E599] bg-black/75 px-1.5 py-0.5 rounded self-end border border-[#00E599]/40">
                          1080 x 1420 Safe Rect
                        </span>
                      </div>

                      {/* Right Action Rail (TikTok / Reels Style) */}
                      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3 text-white drop-shadow-md">
                        {/* Creator Avatar with Follow Plus */}
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E599] to-cyan-400 p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center text-xs font-bold text-white">
                              {assignee.name.charAt(0)}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FF4B55] text-white flex items-center justify-center text-[10px] font-bold">
                            +
                          </div>
                        </div>

                        {/* Like */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                            <Heart className="w-4 h-4 fill-white text-white" />
                          </div>
                          <span className="text-[10px] font-bold mt-0.5">38.4K</span>
                        </div>

                        {/* Comment */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 fill-white text-white" />
                          </div>
                          <span className="text-[10px] font-bold mt-0.5">1,402</span>
                        </div>

                        {/* Bookmark */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                            <Bookmark className="w-4 h-4 fill-white text-white" />
                          </div>
                          <span className="text-[10px] font-bold mt-0.5">890</span>
                        </div>

                        {/* Share */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold mt-0.5">512</span>
                        </div>

                        {/* Spinning Audio Vinyl */}
                        <div className="w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center mt-1 animate-spin duration-3000">
                          <Music className="w-3.5 h-3.5 text-[#00E599]" />
                        </div>
                      </div>

                      {/* Bottom Caption & Audio Area */}
                      <div className="w-[78%] pb-1 px-1 text-white text-xs drop-shadow-md space-y-1">
                        <span className="font-bold text-sm block">@thrill.contentops</span>
                        <p className="text-[11px] text-white/90 line-clamp-2 leading-tight">
                          {asset.hookStrategy || asset.title} #contentops #ai #growth
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-mono">
                          <Music className="w-3 h-3 text-[#00E599]" />
                          <span className="truncate">Thrill Original Sound • Studio Master -14 LUFS</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Top Notification Toast (if revision sent) */}
                  {revisionToast && (
                    <div className="absolute top-4 inset-x-4 bg-[#FF4B55] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl z-30 text-center animate-in slide-in-from-top">
                      {revisionToast}
                    </div>
                  )}
                </div>
              ) : isImage ? (
                /* IMAGE PREVIEW RENDER */
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={activeMediaUrl}
                      alt="Deliverable Proof"
                      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-150 shadow-2xl border border-white/10"
                    />
                  </div>

                  {/* Image Zoom Control Bar */}
                  <div className="absolute bottom-4 bg-[#121620]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-white shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                      className="p-1 hover:text-[#00E599] transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold w-12 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                      className="p-1 hover:text-[#00E599] transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-3 bg-white/20 mx-1" />
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="text-[11px] font-mono text-[#8F9CAE] hover:text-white px-1.5 py-0.5 rounded transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                /* Fallback if URL is external link or doc */
                <div className="text-center p-8 bg-[#121620] border border-white/10 rounded-2xl max-w-md">
                  <ExternalLink className="w-10 h-10 text-[#00E599] mx-auto mb-3" />
                  <h4 className="text-white font-bold text-base mb-1">External Deliverable Attached</h4>
                  <p className="text-xs text-[#8F9CAE] mb-4 break-all">
                    {activeMediaUrl}
                  </p>
                  <a
                    href={activeMediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E599] text-black font-bold text-xs rounded-lg hover:bg-[#00c985] transition-all"
                  >
                    <span>Open in External Player</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

            </div>

            {/* Video Controls Bar (Sticky at bottom of preview area when video) */}
            {isVideo && (
              <div className="h-14 px-6 bg-[#121620] border-t border-white/10 flex items-center justify-between gap-4 shrink-0">
                {/* Play/Pause & Time */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-[#181E2C] hover:bg-[#00E599] text-white hover:text-black flex items-center justify-center transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <div className="text-xs font-mono text-white flex items-center gap-1">
                    <span className="text-[#00E599] font-bold">{formatPlaybackTime(currentTime)}</span>
                    <span className="text-[#8F9CAE]">/</span>
                    <span className="text-[#8F9CAE]">{formatPlaybackTime(duration)}</span>
                  </div>
                </div>

                {/* Scrubber Timeline Slider */}
                <div className="flex-1 max-w-xl mx-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E599]"
                    aria-label="Video scrubber"
                  />
                </div>

                {/* Right controls: Speed, Volume, Fullscreen */}
                <div className="flex items-center gap-3">
                  {/* Playback Speed selector */}
                  <div className="flex items-center gap-1 bg-[#181E2C] p-0.5 rounded-lg border border-white/5">
                    {[1, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          playbackSpeed === spd
                            ? 'bg-[#00E599] text-black font-bold'
                            : 'text-[#8F9CAE] hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Volume / Mute */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1 text-[#8F9CAE] hover:text-white transition-colors"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E599]"
                      aria-label="Volume"
                    />
                  </div>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 text-[#8F9CAE] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* "Request Revision" Slide-over Drawer                     */}
            {/* ======================================================== */}
            {isRevisionDrawerOpen && (
              <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-[#0E121B] border-l border-white/10 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
                
                {/* Drawer Header */}
                <div className="p-4 bg-[#121620] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF4B55]" />
                    <h3 className="text-sm font-bold text-white">Request Revision & Rework</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRevisionDrawerOpen(false)}
                    className="p-1 text-[#8F9CAE] hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {/* Warning banner */}
                  <div className="bg-[#FF4B55]/10 border border-[#FF4B55]/30 rounded-xl p-3 text-xs text-[#FF4B55] leading-relaxed">
                    <strong>RACI Workflow Note:</strong> Submitting revision feedback will revert this card from <strong>Stage 4 (QA Gatekeeper)</strong> back to <strong>Stage 3 (Production Pod)</strong> and notify assigned creative <strong>{assignee.name}</strong>.
                  </div>

                  {/* Quick Timestamp Button */}
                  {isVideo && (
                    <div>
                      <button
                        type="button"
                        onClick={handleInsertTimestamp}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#181E2C] hover:bg-[#202738] text-[#00E599] border border-[#00E599]/30 rounded-lg text-xs font-mono font-semibold transition-all shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Insert Current Timestamp [{formatPlaybackTime(currentTime)}]</span>
                      </button>
                    </div>
                  )}

                  {/* Pre-canned Quick Tags */}
                  <div>
                    <span className="text-[11px] font-mono text-[#8F9CAE] block mb-1.5 uppercase">
                      Quick Issue Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Safe zone overlap on bottom',
                        'Audio exceeds -14 LUFS',
                        'Logo contrast too low in first 3s',
                        'Hook pacing needs tightening',
                        'Missing copyright disclosure'
                      ].map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFeedbackNote((prev) => {
                              const note = `• ${tag}`;
                              return prev ? `${prev}\n${note}` : note;
                            });
                          }}
                          className="text-[11px] bg-white/5 hover:bg-white/10 text-[#8F9CAE] hover:text-white border border-white/5 px-2 py-1 rounded transition-colors text-left"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <label htmlFor="revision-notes" className="text-xs font-mono uppercase text-[#8F9CAE] block">
                      Specific Revision Instructions:
                    </label>
                    <textarea
                      id="revision-notes"
                      ref={feedbackInputRef}
                      rows={6}
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder="e.g. At 00:04: The headline caption collides with the TikTok bottom safe zone. Please shift upwards by 40px and re-render."
                      className="w-full bg-[#121620] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4B55] focus:ring-1 focus:ring-[#FF4B55]/50 transition-all resize-none font-sans"
                    />
                  </div>

                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 bg-[#121620] border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRevisionDrawerOpen(false)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[#8F9CAE] hover:text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!feedbackNote.trim()}
                    onClick={handleSubmitRevision}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#FF4B55] hover:bg-[#e03d47] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Revert to Stage 3</span>
                  </button>
                </div>

              </div>
            )}

          </main>
        </div>

        {/* ======================================================== */}
        {/* Gatekeeper Sign-off Bar (Sticky at Bottom)              */}
        {/* ======================================================== */}
        <footer className="px-6 py-3.5 bg-[#121620] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          
          {/* Left: 4 Binary Checks */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-medium text-slate-400 hidden xl:inline">
              Mandatory Checklist:
            </span>

            {/* 1. Tone & Voice */}
            <button
              type="button"
              onClick={() => handleToggleCheck('qaToneApproved')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                asset.qaToneApproved
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  asset.qaToneApproved ? 'bg-[#00E599] text-black font-bold' : 'border border-white/30'
                }`}
              >
                {asset.qaToneApproved && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>1. Tone & Brand Voice</span>
            </button>

            {/* 2. Format Specs & Safe Zones */}
            <button
              type="button"
              onClick={() => handleToggleCheck('qaSpecsValidated')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                asset.qaSpecsValidated
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  asset.qaSpecsValidated ? 'bg-[#00E599] text-black font-bold' : 'border border-white/30'
                }`}
              >
                {asset.qaSpecsValidated && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>2. Hook & Safe Zones</span>
            </button>

            {/* 3. Rights & IP Clearances */}
            <button
              type="button"
              onClick={() => handleToggleCheck('qaRightsCleared')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                asset.qaRightsCleared
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  asset.qaRightsCleared ? 'bg-[#00E599] text-black font-bold' : 'border border-white/30'
                }`}
              >
                {asset.qaRightsCleared && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>3. Music & Rights</span>
            </button>

            {/* 4. Gatekeeper Final Sign-off (CONTENT_MANAGER ONLY) */}
            <button
              type="button"
              onClick={() => handleToggleCheck('qaGatekeeperSigned')}
              disabled={currentUser.role !== 'CONTENT_MANAGER'}
              title={
                currentUser.role !== 'CONTENT_MANAGER'
                  ? 'Veto Lock: Only Content Manager can authorize final sign-off'
                  : 'Toggle Final Gatekeeper Sign-off'
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                currentUser.role !== 'CONTENT_MANAGER'
                  ? 'opacity-60 cursor-not-allowed bg-[#181E2C] text-[#8F9CAE] border-white/5'
                  : asset.qaGatekeeperSigned
                  ? 'bg-[#00E599]/20 text-[#00E599] border-[#00E599]/50'
                  : 'bg-[#181E2C] text-[#8F9CAE] border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  asset.qaGatekeeperSigned ? 'bg-[#00E599] text-black font-bold' : 'border border-white/30'
                }`}
              >
                {asset.qaGatekeeperSigned && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="flex items-center gap-1">
                <span>4. Final Sign-off</span>
                {currentUser.role !== 'CONTENT_MANAGER' && (
                  <span className="text-[10px] text-[#F5A524] font-mono">(CM Only)</span>
                )}
              </span>
            </button>
          </div>

          {/* Right: Main Sign-off CTA Button */}
          <div className="w-full md:w-auto flex items-center justify-end gap-3">
            {/* Explanatory badge if not allowed */}
            {!signOffCheck.canSignOff && (
              <span className="text-[11px] text-[#F5A524] font-mono hidden sm:inline">
                {currentUser.role !== 'CONTENT_MANAGER'
                  ? 'Locked: Requires Content Manager role'
                  : `Clear ${signOffCheck.missingChecks.length} checklist item(s) to advance`}
              </span>
            )}

            <button
              type="button"
              disabled={!signOffCheck.canSignOff || isSigningOff}
              onClick={handleFinalSignOff}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                signOffCheck.canSignOff
                  ? 'bg-[#00E599] hover:bg-[#00c985] text-black cursor-pointer'
                  : 'bg-white/5 text-[#8F9CAE] border border-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              {isSigningOff ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Advancing Pipeline...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 fill-current text-black" />
                  <span>Sign-off & Send to Ready for Distribution</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </footer>

      </div>
    </div>
  );
};
