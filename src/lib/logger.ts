/**
 * Structured Client-Side Logging Utility for Thrill ContentOps OS
 * 
 * Production post-deployment monitoring:
 * - Structured telemetry for errors, warnings, fatal crashes, and operational events
 * - Direct ingestion into dedicated Supabase 'public.logs' table
 * - Resilient offline & local-development fallback with in-memory ring buffer
 * - Anti-recursion guard to prevent infinite logging loops if network or database calls fail
 * - Safe serialization of complex metadata, stack traces, and user context
 */

import { getSupabaseClient, getSupabaseConfig } from './supabase';

export type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

export interface LogRecord {
  id?: string;
  level: LogLevel;
  event: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  user_id: string | null;
  user_role: string | null;
  url: string;
  user_agent: string;
  created_at: string;
}

export type LogContext = Record<string, unknown>;

// Maximum logs to keep in memory buffer for telemetry inspection & offline debugging
const MAX_BUFFER_SIZE = 100;

// Internal state
const inMemoryLogs: LogRecord[] = [];
let currentUserId: string | null = null;
let currentUserRole: string | null = null;
let isDispatchingLog = false;
let globalHandlersInitialized = false;

/**
 * Configure active user context for all subsequent log entries
 */
export function setUserContext(userId?: string | null, userRole?: string | null): void {
  currentUserId = userId ?? null;
  currentUserRole = userRole ?? null;
}

/**
 * Retrieve current user context
 */
export function getUserContext(): { userId: string | null; userRole: string | null } {
  return { userId: currentUserId, userRole: currentUserRole };
}

/**
 * Safely stringifies objects handling circular references
 */
export function safeSerialize(obj: unknown): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return { value: String(obj) };
  }

  const seen = new WeakSet();
  try {
    const serialized = JSON.parse(
      JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        }
        return value;
      })
    );
    return typeof serialized === 'object' && serialized !== null ? serialized : { data: serialized };
  } catch (err) {
    return { serialization_error: String(err), preview: String(obj).slice(0, 200) };
  }
}

/**
 * Extracts normalized message and stack trace from any error-like or string input
 */
export function extractErrorInfo(errorOrMessage: unknown): { message: string; stack: string | null } {
  if (!errorOrMessage) {
    return { message: 'Unknown error', stack: null };
  }

  if (errorOrMessage instanceof Error) {
    return {
      message: errorOrMessage.message || errorOrMessage.name || 'Error',
      stack: errorOrMessage.stack || null
    };
  }

  if (typeof errorOrMessage === 'string') {
    return { message: errorOrMessage, stack: null };
  }

  if (typeof errorOrMessage === 'object') {
    const candidate = errorOrMessage as Record<string, unknown>;
    const message = typeof candidate.message === 'string'
      ? candidate.message
      : typeof candidate.error === 'string'
      ? candidate.error
      : JSON.stringify(safeSerialize(candidate));
    const stack = typeof candidate.stack === 'string' ? candidate.stack : null;
    return { message, stack };
  }

  return { message: String(errorOrMessage), stack: null };
}

/**
 * Gets safe browser environment properties
 */
function getEnvironmentInfo(): { url: string; userAgent: string } {
  const url = typeof window !== 'undefined' && window.location ? window.location.href : 'node:process';
  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'ContentOps-Agent/1.0';
  return { url, userAgent };
}

/**
 * Sends a log entry to Supabase 'public.logs' table
 * Non-blocking, fails gracefully without crashing the host app
 */
async function dispatchToSupabase(record: LogRecord): Promise<boolean> {
  // Guard against recursive loops if logging inside a failed supabase query
  if (isDispatchingLog) {
    return false;
  }

  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return false;
  }

  isDispatchingLog = true;
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('logs').insert({
      level: record.level,
      event: record.event,
      message: record.message,
      stack: record.stack,
      context: record.context,
      user_id: record.user_id,
      user_role: record.user_role,
      url: record.url,
      user_agent: record.user_agent,
      created_at: record.created_at
    });

    if (error) {
      // Internal warning only (suppress to avoid recursion)
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[ContentOps Logger] Ingestion failed:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[ContentOps Logger] Network dispatch exception:', err);
    }
    return false;
  } finally {
    isDispatchingLog = false;
  }
}

/**
 * Core logging method
 */
export function log(
  level: LogLevel,
  event: string,
  errorOrMessage: unknown,
  context?: LogContext
): LogRecord {
  const { message, stack } = extractErrorInfo(errorOrMessage);
  const { url, userAgent } = getEnvironmentInfo();
  const serializedContext = context ? safeSerialize(context) : {};

  const record: LogRecord = {
    level,
    event,
    message,
    stack,
    context: serializedContext,
    user_id: currentUserId,
    user_role: currentUserRole,
    url,
    user_agent: userAgent,
    created_at: new Date().toISOString()
  };

  // 1. Maintain in-memory ring buffer for post-deployment UI inspection
  inMemoryLogs.push(record);
  if (inMemoryLogs.length > MAX_BUFFER_SIZE) {
    inMemoryLogs.shift();
  }

  // 2. Output to console with distinct level styling
  if (typeof console !== 'undefined') {
    const prefix = `[ContentOps:${level.toUpperCase()}][${event}]`;
    switch (level) {
      case 'fatal':
      case 'error':
        console.error(prefix, message, { context: serializedContext, stack, user_id: currentUserId });
        break;
      case 'warn':
        console.warn(prefix, message, { context: serializedContext, user_id: currentUserId });
        break;
      case 'info':
      default:
        console.info(prefix, message, { context: serializedContext });
        break;
    }
  }

  // 3. Dispatch to Supabase asynchronously (fire-and-forget, never blocks caller)
  dispatchToSupabase(record).catch(() => {
    // Non-fatal, suppressed by design
  });

  return record;
}

/**
 * Log informational operational event
 */
export function logInfo(event: string, message: string, context?: LogContext): LogRecord {
  return log('info', event, message, context);
}

/**
 * Log a non-fatal warning condition
 */
export function logWarn(event: string, errorOrMessage: unknown, context?: LogContext): LogRecord {
  return log('warn', event, errorOrMessage, context);
}

/**
 * Log an error condition
 */
export function logError(event: string, errorOrMessage: unknown, context?: LogContext): LogRecord {
  return log('error', event, errorOrMessage, context);
}

/**
 * Log a fatal unrecoverable crash or critical boundary violation
 */
export function logFatal(event: string, errorOrMessage: unknown, context?: LogContext): LogRecord {
  return log('fatal', event, errorOrMessage, context);
}

/**
 * Returns recent logs buffered in memory
 */
export function getRecentLogs(): LogRecord[] {
  return [...inMemoryLogs];
}

/**
 * Clears buffered logs from memory
 */
export function clearRecentLogs(): void {
  inMemoryLogs.length = 0;
}

/**
 * Initializes global client-side error listeners:
 * - window.onerror
 * - window.onunhandledrejection
 */
export function initGlobalErrorLogging(): () => void {
  if (typeof window === 'undefined' || globalHandlersInitialized) {
    return () => {};
  }

  const handleError = (event: ErrorEvent) => {
    logError('window_uncaught_error', event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    logError('unhandled_promise_rejection', event.reason, {
      type: 'UnhandledPromiseRejection'
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  globalHandlersInitialized = true;

  logInfo('client_logger_initialized', 'Global window error and promise rejection listeners registered');

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    globalHandlersInitialized = false;
  };
}
