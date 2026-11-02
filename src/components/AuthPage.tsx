import React, { useState } from "react";
import { 
  X, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft
} from "lucide-react";
import { User } from "../types";
import { authenticateWithEmail, authenticateWithGoogle } from "../lib/auth";
import {
  getSupabaseConfig,
  supabaseSignInWithOtp,
  supabaseSignInWithOAuth
} from "../lib/supabase";
import { BrandLogo } from "./BrandLogo";

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  initialTab?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onClose
}) => {
  const [view, setView] = useState<"chooser" | "email_magic_link">("chooser");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const supabaseConfig = getSupabaseConfig();

  // 1. Google OAuth via Supabase (or instant dev OAuth session)
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (supabaseConfig.isConfigured) {
        await supabaseSignInWithOAuth("google");
      } else if (import.meta.env.DEV) {
        const session = await authenticateWithGoogle("demo.operator@thrill.ai", "Google Workspace User");
        onLoginSuccess(session.user);
      } else {
        setAuthError("Google SSO requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be configured in production.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Google authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Magic Link dispatch
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setSuccessNotice(null);

    try {
      if (supabaseConfig.isConfigured) {
        await supabaseSignInWithOtp(trimmed);
        setSuccessNotice(`Magic link dispatched to ${trimmed}! Check your inbox to sign in.`);
      } else {
        // Fallback for local development/unconfigured Supabase
        const session = await authenticateWithEmail(trimmed);
        setSuccessNotice(`Welcome! Session verified for ${session.user.name}.`);
        setTimeout(() => {
          onLoginSuccess(session.user);
        }, 600);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to dispatch magic sign-in link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Centered Modal Card matching Image 2 */}
      <div className="relative w-full max-w-[420px] bg-[#222736] rounded-[40px] px-8 py-10 shadow-2xl border border-white/10 flex flex-col items-center select-none text-white">
        
        {/* Top-Right Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Thrill Logo */}
        <div className="mb-4">
          <BrandLogo size="xl" showText={false} logoColor="text-white" />
        </div>

        {/* Header Text */}
        <p className="text-base font-medium text-slate-300 text-center mb-8">
          {view === "chooser" ? "Sign in or sign up with:" : "Sign in with Email Magic Link:"}
        </p>

        {/* Alerts */}
        {successNotice && (
          <div className="w-full mb-6 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00E599]" />
            <span>{successNotice}</span>
          </div>
        )}

        {authError && (
          <div className="w-full mb-6 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* VIEW 1: Main Chooser (Google & Email Circular Buttons matching Image 2) */}
        {view === "chooser" ? (
          <div className="w-full flex items-center justify-center gap-12 my-2">
            {/* Google Button */}
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                aria-label="Sign in with Google"
                className="w-16 h-16 rounded-full bg-[#2e3547] hover:bg-[#394258] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                )}
              </button>
              <span className="text-xs font-medium text-slate-300">Google</span>
            </div>

            {/* Email Magic Link Button */}
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setSuccessNotice(null);
                  setView("email_magic_link");
                }}
                disabled={isLoading}
                aria-label="Sign in with Email"
                className="w-16 h-16 rounded-full bg-[#2e3547] hover:bg-[#394258] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
              >
                <Mail className="w-6 h-6 text-white" />
              </button>
              <span className="text-xs font-medium text-slate-300">Email</span>
            </div>
          </div>
        ) : (
          /* VIEW 2: Email Magic Link Input Form */
          <form onSubmit={handleSendMagicLink} className="w-full space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.io"
                  className="w-full bg-[#181c28] border border-[#31394e] focus:border-[#00E599] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-[#00E599] hover:bg-[#00c985] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Send Magic Sign-In Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setSuccessNotice(null);
                setView("chooser");
              }}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to login options</span>
            </button>
          </form>
        )}

        {/* Footer Legal Terms */}
        <p className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed mt-10">
          By continuing, you agree to thrill’s{" "}
          <a href="#terms" className="underline hover:text-slate-300 transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className="underline hover:text-slate-300 transition-colors">
            Privacy Policy
          </a>
          .
        </p>

      </div>
    </div>
  );
};
