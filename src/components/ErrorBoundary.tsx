import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logFatal } from '../lib/logger';
import { AlertOctagon, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log directly to Supabase via structured client-side logger
    logFatal('react_error_boundary', error, {
      componentStack: errorInfo.componentStack,
      location: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  }

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleCopy = (): void => {
    const errorDetails = `Error: ${this.state.error?.message || 'Unknown'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Application Exception Caught</h1>
                <p className="text-sm text-slate-400">
                  Telemetry error log has been dispatched to Supabase for production monitoring.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 space-y-2">
              <div className="text-red-400 font-semibold">{this.state.error?.toString()}</div>
              {this.state.error?.stack && (
                <div className="text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {this.state.error.stack.slice(0, 500)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={this.handleCopy}
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Details</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Diagnostics</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleReload}
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-red-950/50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
