import { AuthSession, User, UserRole } from '../types';
import { SEED_USERS } from './seedData';

const AUTH_STORAGE_KEY = 'contentops_auth_session';

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed?.user?.id) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Authenticates with email (Passwordless: matches seed users or creates verified session)
 */
export async function authenticateWithEmail(
  email: string,
  preferredRole: UserRole = 'CONTENT_MANAGER',
  customName?: string
): Promise<AuthSession> {
  // Artificial micro-delay for realistic tactile feedback
  await new Promise((r) => setTimeout(r, 450));

  const trimmed = email.trim().toLowerCase();
  const matchedUser = SEED_USERS.find((u) => u.email.toLowerCase() === trimmed);

  let user: User;
  if (matchedUser) {
    user = matchedUser;
  } else {
    // Generate test user for custom email
    const namePart = customName?.trim() || email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'ContentOps Operator';

    user = {
      id: `u-test-${Date.now()}`,
      name: formattedName,
      email: trimmed,
      role: preferredRole,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      department: 'Enterprise Content & Strategy Pod'
    };
  }

  const session: AuthSession = {
    user,
    token: `magic-token-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    provider: 'email',
    loginAt: new Date().toISOString()
  };

  saveSession(session);
  return session;
}

/**
 * Requests a passwordless magic OTP code
 */
export async function requestMagicCode(email: string): Promise<{ code: string; expiresAt: string }> {
  await new Promise((r) => setTimeout(r, 350));
  const testCode = '749102'; // Deterministic test OTP for seamless testing
  return {
    code: testCode,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
}

/**
 * Authenticates with Google (OAuth flow simulation or instant Google session)
 */
export async function authenticateWithGoogle(
  email = 'previewsites40@gmail.com',
  name = 'Google Workspace User'
): Promise<AuthSession> {
  await new Promise((r) => setTimeout(r, 600));

  const user: User = {
    id: `u-google-${Date.now()}`,
    name,
    email,
    role: 'CONTENT_MANAGER',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Global Content & Operations (Google SSO)'
  };

  const session: AuthSession = {
    user,
    token: `g-oauth-${Date.now()}`,
    provider: 'google',
    loginAt: new Date().toISOString()
  };

  saveSession(session);
  return session;
}
