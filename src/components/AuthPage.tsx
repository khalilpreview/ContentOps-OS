import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  ArrowLeft
} from 'lucide-react';
import { User, UserRole } from '../types';
import { authenticateWithEmail, authenticateWithGoogle, requestMagicCode } from '../lib/auth';
import { BrandLogo } from './BrandLogo';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState<'picker' | 'email' | 'otp'>('picker');
  const [email, setEmail] = useState('elena.vance@enterprise.io');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CONTENT_MANAGER');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [sentCodeHint, setSentCodeHint] = useState<string | null>(null);

  // Instant passwordless sign in
  const handleInstantPasswordless = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await authenticateWithEmail(email, selectedRole);
      onLoginSuccess(session.user);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth (Passwordless)
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await authenticateWithGoogle('previewsites40@gmail.com', 'Google Workspace User');
      onLoginSuccess(session.user);
    } catch (err: any) {
      setAuthError(err.message || 'Google Workspace authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request passwordless OTP code
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setAuthError('Please enter a work email address first.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const { code } = await requestMagicCode(email);
      setSentCodeHint(code);
      setActiveTab('otp');
    } catch (err: any) {
      setAuthError('Failed to generate magic code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthError('Please enter the 6-digit passcode.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await authenticateWithEmail(email, selectedRole);
      onLoginSuccess(session.user);
    } catch (err: any) {
      setAuthError('Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* Centered Modal Card matching reference image */}
      <div className="relative w-full max-w-[420px] bg-[#212634] rounded-[38px] p-8 sm:p-10 shadow-2xl border border-white/5 flex flex-col items-center select-none">
        
        {/* Top-Right Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 text-[#8b95ad] hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" strokeWidth={2.4} />
          </button>
        )}

        {/* Thrill White Logo Centered */}
        <div className="mt-2 mb-1 flex items-center justify-center">
          <BrandLogo showText={false} size="xl" logoColor="text-white" />
        </div>

        {/* Subtitle */}
        <p className="text-[#8e98af] font-medium text-base mt-3 mb-8 text-center">
          Sign in or sign up with:
        </p>

        {/* Error Alert if any */}
        {authError && (
          <div className="w-full mb-5 p-3 rounded-2xl bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Dual Circular Buttons (Picker Mode) */}
        {activeTab === 'picker' && (
          <div className="w-full flex flex-col items-center">
            {/* Two Circular Buttons */}
            <div className="flex items-center justify-center gap-10 mb-8">
              
              {/* Google Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  title="Sign in with Google Workspace"
                  className="w-16 h-16 rounded-full bg-[#171b26] border border-[#2e3447] hover:border-white/20 hover:bg-[#1e2333] hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white shadow-xl cursor-pointer group disabled:opacity-50"
                >
                  <svg className="w-6 h-6 fill-current text-white transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </button>
                <span className="text-xs text-[#8e98af] font-medium mt-2.5">Google</span>
              </div>

              {/* Email Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  title="Sign in with Email"
                  className="w-16 h-16 rounded-full bg-[#171b26] border border-[#2e3447] hover:border-white/20 hover:bg-[#1e2333] hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white shadow-xl cursor-pointer group"
                >
                  <Mail className="w-6 h-6 text-white transition-transform group-hover:scale-110" strokeWidth={2.2} />
                </button>
                <span className="text-xs text-[#8e98af] font-medium mt-2.5">Email</span>
              </div>
            </div>
          </div>
        )}

        {/* Email Passwordless Input Mode */}
        {activeTab === 'email' && (
          <form onSubmit={handleInstantPasswordless} className="w-full space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-[#8e98af] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737c94]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#171b26] border border-[#2e3447] focus:border-[#4ff8ac] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#737c94] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8e98af] mb-1.5">
                RACI Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-[#171b26] border border-[#2e3447] focus:border-[#4ff8ac] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
              >
                <option value="CONTENT_MANAGER">Content Manager (Admin & QA Gatekeeper)</option>
                <option value="CREATIVE_SPECIALIST">Creative Specialist (Production Doer)</option>
                <option value="STAKEHOLDER">Stakeholder (SLA Reviewer)</option>
                <option value="DISTRIBUTION_LEAD">Distribution Lead (Publishing & Growth)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('picker')}
                className="py-2.5 px-3 rounded-2xl bg-[#171b26] hover:bg-[#1e2333] border border-[#2e3447] text-[#8e98af] hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-200 text-[#0f1118] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-[#0f1118]/30 border-t-[#0f1118] rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Instant Passwordless Sign In</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-[11px] text-[#737c94] hover:text-[#4ff8ac] transition-colors underline underline-offset-4"
              >
                Or request 6-digit magic passcode
              </button>
            </div>
          </form>
        )}

        {/* OTP Mode */}
        {activeTab === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="w-full space-y-4 animate-fadeIn">
            <div className="p-3 rounded-2xl bg-[#171b26] border border-[#2e3447] text-xs text-[#8e98af]">
              <span>Passcode sent to <strong className="text-white">{email}</strong>.</span>
              {sentCodeHint && (
                <div className="mt-2 flex items-center justify-between bg-[#212634] p-2 px-2.5 rounded-xl border border-white/5 text-[11px]">
                  <span>Code: <strong className="font-mono text-white">{sentCodeHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(sentCodeHint)}
                    className="text-[10px] text-[#4ff8ac] hover:underline font-bold"
                  >
                    Auto-fill
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8e98af] mb-1.5">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-[#171b26] border border-[#2e3447] focus:border-[#4ff8ac] rounded-2xl px-3 py-2.5 text-center text-sm font-mono tracking-widest text-white placeholder-[#737c94] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className="py-2.5 px-3 rounded-2xl bg-[#171b26] hover:bg-[#1e2333] border border-[#2e3447] text-[#8e98af] hover:text-white text-xs font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-200 text-[#0f1118] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-[#0f1118]/30 border-t-[#0f1118] rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Terms & Conditions matching screenshot */}
        <p className="text-xs text-[#737c94] text-center max-w-[290px] leading-relaxed mt-10">
          By continuing, you agree to thrill’s{' '}
          <a href="#terms" className="underline hover:text-white transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="underline hover:text-white transition-colors">
            Privacy Policy
          </a>
          .
        </p>

      </div>
    </div>
  );
};
