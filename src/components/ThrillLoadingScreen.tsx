import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ThrillLoadingScreenProps {
  onComplete: () => void;
  /** Optional initial mode: 'auto' transitions automatically after completion, 'preview' stays until dismissed */
  mode?: 'auto' | 'preview';
}

const THRILL_PATHS = [
  'M20.4266 4.56681H17.2569L16.2408 8.37525H15.9923V0.00105366H9.98967V14.9551H6.00264V9.32658H8.50104V4.56681H6.00264V0.00105366H0V16.1939C0 18.2921 1.72845 20 3.85371 20H8.52313L9.74196 15.4311H9.99046V20H15.9931V10.4719C15.9931 9.85328 16.5035 9.33983 17.1299 9.32736C17.7246 9.32736 18.2777 9.70749 18.2777 10.4711V20H24.2804V8.37291C24.2804 6.27391 22.5519 4.56681 20.4274 4.56681Z',
  'M43.1273 4.56624H37.1246V19.9994H43.1273V4.56624Z',
  'M43.1273 0.00102984H37.1247V3.25861H43.1273V0.00102984Z',
  'M58.5853 19.999H55.9678C54.2796 19.999 52.8043 18.9308 52.2955 17.3413L52.0273 16.503L51.0948 19.999H48.4718C46.3473 19.999 44.6181 18.2919 44.6181 16.1929V0H50.6207V14.954H52.1085V0H58.1112V14.954H59.9469L58.5853 19.999Z',
  'M32.0189 8.3747H31.7704V4.56626H25.7677V19.9995H31.7704V10.4425C31.7704 9.82702 32.2776 9.32681 32.9001 9.32681H35.6375V4.56704H33.0342L32.0181 8.37548L32.0189 8.3747Z',
];

interface BubbleParticle {
  id: number;
  x: number;
  baseY: number;
  radius: number;
  speed: number;
  wobbleFreq: number;
  phase: number;
}

const BUBBLES: BubbleParticle[] = [
  { id: 1, x: 4.5, baseY: 21, radius: 0.42, speed: 0.9, wobbleFreq: 2.1, phase: 0.2 },
  { id: 2, x: 12.8, baseY: 22, radius: 0.34, speed: 1.15, wobbleFreq: 2.6, phase: 1.4 },
  { id: 3, x: 21.2, baseY: 20.5, radius: 0.48, speed: 0.85, wobbleFreq: 1.9, phase: 2.8 },
  { id: 4, x: 28.7, baseY: 21.8, radius: 0.36, speed: 1.05, wobbleFreq: 2.4, phase: 3.9 },
  { id: 5, x: 40.1, baseY: 22.5, radius: 0.44, speed: 0.95, wobbleFreq: 2.2, phase: 0.8 },
  { id: 6, x: 47.6, baseY: 21.2, radius: 0.38, speed: 1.2, wobbleFreq: 2.8, phase: 4.5 },
  { id: 7, x: 55.3, baseY: 22.1, radius: 0.5, speed: 0.88, wobbleFreq: 2.0, phase: 5.1 },
];

/**
 * Generates a smooth horizontal wave path across the SVG viewBox [-4, 64]
 * closing down to the bottom of the coordinate space.
 */
function buildWavePath(
  waterY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  secondaryAmplitude: number,
  secondaryPhase: number
): string {
  const startX = -4;
  const endX = 64;
  const step = 1.5;
  let d = `M ${startX} 26 L ${startX} ${waterY.toFixed(3)}`;

  for (let x = startX; x <= endX; x += step) {
    const rad1 = (x / wavelength) * Math.PI * 2 + phase;
    const rad2 = (x / (wavelength * 0.58)) * Math.PI * 2 - secondaryPhase;
    const y =
      waterY +
      Math.sin(rad1) * amplitude +
      Math.cos(rad2) * secondaryAmplitude;
    d += ` L ${x.toFixed(2)} ${y.toFixed(3)}`;
  }

  d += ` L ${endX} 26 Z`;
  return d;
}

/**
 * Generates the top meniscus highlight stroke path along the crest of the primary wave.
 */
function buildMeniscusStrokePath(
  waterY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  secondaryAmplitude: number,
  secondaryPhase: number
): string {
  const startX = -4;
  const endX = 64;
  const step = 1.5;
  let d = '';

  for (let x = startX; x <= endX; x += step) {
    const rad1 = (x / wavelength) * Math.PI * 2 + phase;
    const rad2 = (x / (wavelength * 0.58)) * Math.PI * 2 - secondaryPhase;
    const y =
      waterY +
      Math.sin(rad1) * amplitude +
      Math.cos(rad2) * secondaryAmplitude;
    d += x === startX ? `M ${x.toFixed(2)} ${y.toFixed(3)}` : ` L ${x.toFixed(2)} ${y.toFixed(3)}`;
  }

  return d;
}

export const ThrillLoadingScreen: React.FC<ThrillLoadingScreenProps> = ({
  onComplete,
  mode = 'auto',
}) => {
  // Overall progress from 0 to 100
  const [progress, setProgress] = useState<number>(0);
  const [waveTick, setWaveTick] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  // Total duration of the choreographed outline -> liquid fill animation (ms)
  const TOTAL_DURATION_MS = 2800;

  const triggerExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    window.setTimeout(() => {
      onComplete();
    }, 450);
  }, [isExiting, onComplete]);

  // Keyboard accessibility: Allow Space or Enter or Escape to skip directly into workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerExit]);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const step = (now: number) => {
      setWaveTick(now * 0.0045);

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      const rawFraction = Math.min(1, elapsed / TOTAL_DURATION_MS);

      // Smooth easing curve: outline trace (0..0.22), dynamic liquid rise (0.22..0.95), lock (0.95..1)
      let easedProgress: number;
      if (rawFraction < 0.22) {
        const t = rawFraction / 0.22;
        easedProgress = t * 18;
      } else {
        const t = (rawFraction - 0.22) / 0.78;
        const smoothT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        easedProgress = 18 + smoothT * 82;
      }

      const clamped = Math.min(100, Math.max(0, easedProgress));
      setProgress(clamped);

      if (clamped >= 100 && !exitTimerRef.current) {
        // In auto mode, automatically exit cleanly into workspace; in preview mode, allow brief hold
        const holdDelay = mode === 'preview' ? 1200 : 420;
        exitTimerRef.current = window.setTimeout(() => {
          triggerExit();
        }, holdDelay);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, [mode, triggerExit]);

  // Phase 1: Outline stroke draw-in (0% -> 20% of overall progress maps to 0 -> 100% outline drawn)
  const outlineFactor = Math.min(1, progress / 20);
  const strokeDashTotal = 180;
  const strokeDashOffset = strokeDashTotal * (1 - outlineFactor);

  // Phase 2: Water fill level (starts rising at 14% progress, reaches full top at 98% progress)
  const liquidFillFraction = Math.max(0, Math.min(1, (progress - 14) / 84));

  // SVG viewBox vertical range is 0 (top) to 20 (bottom).
  // 0% liquid is y = 21.6 (just below base) and 100% liquid is y = -1.2 (completely submerged).
  const waterLevelY = 21.6 - liquidFillFraction * 22.8;

  // Dynamic wave amplitude: zero when completely empty or 100% full, lively slosh in the middle
  const sloshEnvelope =
    liquidFillFraction <= 0.01 || liquidFillFraction >= 0.99
      ? 0
      : Math.sin(liquidFillFraction * Math.PI) * 0.95 + 0.28;

  const frontWavePath = buildWavePath(
    waterLevelY,
    1.15 * sloshEnvelope,
    24,
    waveTick * 1.35,
    0.42 * sloshEnvelope,
    waveTick * 2.1
  );

  const midWavePath = buildWavePath(
    waterLevelY - 0.35 * sloshEnvelope,
    1.35 * sloshEnvelope,
    28,
    -waveTick * 1.05 + 1.8,
    0.5 * sloshEnvelope,
    waveTick * 1.65
  );

  const backWavePath = buildWavePath(
    waterLevelY - 0.65 * sloshEnvelope,
    1.45 * sloshEnvelope,
    32,
    waveTick * 0.85 + 3.4,
    0.45 * sloshEnvelope,
    -waveTick * 1.4
  );

  const meniscusCrestPath = buildMeniscusStrokePath(
    waterLevelY,
    1.15 * sloshEnvelope,
    24,
    waveTick * 1.35,
    0.42 * sloshEnvelope,
    waveTick * 2.1
  );

  const isFullyFilled = progress >= 98.5;

  const statusLabel =
    progress < 20
      ? 'Calibrating Vector Engine'
      : progress < 55
      ? 'Hydrating Production Pipeline'
      : progress < 94
      ? 'Aligning Enterprise Protocols'
      : 'ContentOps Ready';

  return (
    <div
      role="dialog"
      aria-label="Thrill ContentOps Loading Screen"
      className={`fixed inset-0 z-[120] bg-[#0B0E14] text-white flex flex-col justify-between select-none overflow-hidden transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background radial atmosphere & subtle architectural grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 229, 153, ${0.05 + liquidFillFraction * 0.08}) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 70%),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        }}
      />

      {/* Top minimal header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 pt-8 flex items-center justify-between text-xs text-[#8F9CAE]">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-white tracking-wide uppercase text-[11px]">Thrill</span>
          <span className="text-[#00E599]" aria-hidden="true">/</span>
          <span className="text-white/70">ContentOps OS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse" />
          <span className="font-mono tabular-nums text-white/90 text-xs tracking-wider">
            {Math.round(progress).toString().padStart(3, '0')}%
          </span>
        </div>
      </header>

      {/* Center Stage: Hero Outlined -> Liquid White Thrill Logo */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-4">
        <div className="relative w-full max-w-[560px] flex flex-col items-center">
          {/* Ambient luminous optical bloom behind logo */}
          <div
            className="pointer-events-none absolute inset-0 -m-16 rounded-full blur-3xl transition-opacity duration-700"
            style={{
              background:
                'radial-gradient(circle, rgba(0, 229, 153, 0.16) 0%, rgba(255, 255, 255, 0.12) 35%, transparent 72%)',
              opacity: 0.25 + liquidFillFraction * 0.75,
              transform: `scale(${0.9 + liquidFillFraction * 0.2})`,
            }}
          />

          {/* Thrill SVG Liquid Container */}
          <div className="relative w-full py-8 sm:py-12 px-6 sm:px-12 flex items-center justify-center">
            <svg
              viewBox="-2 -2 64 24"
              className="w-full max-w-[460px] h-auto overflow-visible drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Thrill Logo Liquid Fill Animation"
            >
              <defs>
                {/* Exact Thrill SVG geometry clip path */}
                <clipPath id="thrill-water-clip">
                  {THRILL_PATHS.map((d, idx) => (
                    <path key={idx} d={d} />
                  ))}
                </clipPath>

                {/* Pure white liquid vertical gradient with pearlescent depth */}
                <linearGradient id="thrill-pure-white-liquid" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="65%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>

                {/* Translucent secondary wave gradient */}
                <linearGradient id="thrill-mid-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
                  <stop offset="50%" stopColor="rgba(226, 232, 240, 0.75)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.55)" />
                </linearGradient>

                {/* Subtle emerald refractive subsurface back wave */}
                <linearGradient id="thrill-back-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0, 229, 153, 0.35)" />
                  <stop offset="50%" stopColor="rgba(255, 255, 255, 0.40)" />
                  <stop offset="100%" stopColor="rgba(0, 229, 153, 0.35)" />
                </linearGradient>

                {/* Soft glow filter for the meniscus crest and final white lock */}
                <filter id="thrill-liquid-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* LAYER 1: Hollow glass interior base (visible before water fills it) */}
              <g opacity={0.15 + outlineFactor * 0.85}>
                {THRILL_PATHS.map((d, idx) => (
                  <path
                    key={`cavity-${idx}`}
                    d={d}
                    fill="rgba(18, 22, 32, 0.72)"
                  />
                ))}
              </g>

              {/* LAYER 2: Clipped Liquid Water Simulation inside the Thrill letterforms */}
              <g clipPath="url(#thrill-water-clip)">
                {/* 2A. Deep subsurface emerald refractive back wave */}
                {liquidFillFraction > 0 && (
                  <path d={backWavePath} fill="url(#thrill-back-wave-grad)" />
                )}

                {/* 2B. Counter-oscillating pearlescent mid-wave */}
                {liquidFillFraction > 0 && (
                  <path d={midWavePath} fill="url(#thrill-mid-wave-grad)" />
                )}

                {/* 2C. Primary pure white water body */}
                {liquidFillFraction > 0 && (
                  <path
                    d={frontWavePath}
                    fill="url(#thrill-pure-white-liquid)"
                    filter={isFullyFilled ? 'url(#thrill-liquid-glow)' : undefined}
                  />
                )}

                {/* 2D. Specular meniscus surface tension highlight line */}
                {liquidFillFraction > 0.02 && liquidFillFraction < 0.98 && (
                  <path
                    d={meniscusCrestPath}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.38"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                )}

                {/* 2E. Rising micro-effervescence bubbles inside the submerged region */}
                {liquidFillFraction > 0.08 &&
                  liquidFillFraction < 0.98 &&
                  BUBBLES.map((b) => {
                    const cycle = (waveTick * b.speed + b.phase) % 1;
                    const bubbleY = 20.5 - cycle * (20.5 - waterLevelY + 1.5);
                    const bubbleX =
                      b.x + Math.sin(waveTick * b.wobbleFreq + b.phase) * 0.55;
                    const isSubmerged = bubbleY > waterLevelY + 0.6;
                    if (!isSubmerged) return null;
                    return (
                      <circle
                        key={b.id}
                        cx={bubbleX}
                        cy={bubbleY}
                        r={b.radius}
                        fill="rgba(11, 14, 20, 0.18)"
                        stroke="rgba(255, 255, 255, 0.85)"
                        strokeWidth="0.14"
                      />
                    );
                  })}
              </g>

              {/* LAYER 3: Precision Vector Outline (draws itself in first, then frames the rising liquid) */}
              <g>
                {THRILL_PATHS.map((d, idx) => (
                  <path
                    key={`outline-${idx}`}
                    d={d}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={isFullyFilled ? '0.28' : '0.36'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={strokeDashTotal}
                    strokeDashoffset={strokeDashOffset}
                    opacity={isFullyFilled ? 0.95 : 0.78}
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Typography & Fluid Telemetry Readout below Logo */}
          <div className="mt-5 flex flex-col items-center gap-3 w-full max-w-[340px]">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#8F9CAE] font-medium tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00E599] animate-pulse" />
                <span>{statusLabel}</span>
              </span>
              <span className="font-mono tabular-nums text-white font-semibold">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Precision water-level progress track with glow pulse */}
            <div className="w-full h-1 bg-[#181E2C] rounded-full overflow-hidden p-[1px] border border-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-white via-white to-[#00E599] transition-all duration-75 rounded-full"
                style={{
                  width: `${progress}%`,
                  boxShadow: '0 0 14px rgba(0, 229, 153, 0.45)',
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Clean, unobtrusive minimal bottom bar with skip cue */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 pb-8 flex items-center justify-between text-[11px] text-[#8F9CAE]">
        <div className="flex items-center gap-2 text-[#8F9CAE]/70">
          <span>Enterprise Content Orchestration</span>
        </div>

        <button
          type="button"
          onClick={triggerExit}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-150 cursor-pointer group"
          title="Press Space or Enter to proceed"
        >
          <span>Skip to workspace</span>
          <ArrowRight className="w-3 h-3 text-[#00E599] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </footer>
    </div>
  );
};

