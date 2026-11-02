import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Key, 
  Trash2, 
  RefreshCw, 
  Check, 
  Send, 
  AlertCircle,
  Lock,
  Crown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';
import { fetchAdminUsers, inviteAdminUser, updateAdminUserRole, deleteAdminUser } from '../lib/apiClient';

interface SuperAdminPageProps {
  currentUser: User;
  onRefreshUsers?: (users: User[]) => void;
}

const ROLES_INFO: Array<{
  role: UserRole;
  title: string;
  badgeClass: string;
  desc: string;
  capabilities: string[];
}> = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    badgeClass: 'bg-[#FF4B55]/15 text-[#FF4B55] border-[#FF4B55]/30',
    desc: 'Unrestricted enterprise authority over operators, invite dispatch, and state bypasses.',
    capabilities: ['User Provisioning & Magic Link Invites', 'All State Machine Transitions', 'Final Gatekeeper QA Sign-off', 'Direct Production Syndication']
  },
  {
    role: 'CONTENT_MANAGER',
    title: 'Content Manager',
    badgeClass: 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30',
    desc: 'Pod leader governing creative briefs, SLA enforcement, and final 4-point QA Veto sign-off.',
    capabilities: ['Approve Brief SLA Reviews', 'Veto & Final 4-Point Sign-off', 'Rework / Revision Requests', 'Publish to Syndication Archive']
  },
  {
    role: 'CREATIVE_SPECIALIST',
    title: 'Creative Specialist',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    desc: 'Production specialist executing video, motion, typography, and deliverable masters.',
    capabilities: ['Draft & Polish Creative Briefs', 'Deliverable URL Upload', 'Submit to QA Gatekeeper', 'Address Rework Feedback']
  },
  {
    role: 'STAKEHOLDER',
    title: 'Stakeholder / Brand Guardian',
    badgeClass: 'bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30',
    desc: 'Executive brand review reviewing briefs and SLA turnaround guarantees.',
    capabilities: ['Review & Authorize SLA Briefs', 'Reject Brief Back to Drafting', 'Monitor Campaign Metrics']
  },
  {
    role: 'DISTRIBUTION_LEAD',
    title: 'Distribution Lead',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    desc: 'Omnichannel growth lead syndicating approved masters to paid and organic networks.',
    capabilities: ['Move Ready Assets to Published Archive', 'Attach Reach & Impression Metrics', 'Promote Winning Formats to Paid Growth']
  }
];

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({
  currentUser,
  onRefreshUsers
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('CREATIVE_SPECIALIST');
  const [inviteTeam, setInviteTeam] = useState('Executive ContentOps Pod');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const isSuperAdminOrManager = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'CONTENT_MANAGER';

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminUsers();
      if (data && data.length > 0) {
        setUsers(data);
        onRefreshUsers?.(data);
      }
    } catch (err: any) {
      console.warn('Could not load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setNotice(null);

    try {
      const res = await inviteAdminUser({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: inviteRole,
        team: inviteTeam.trim(),
      });

      setNotice({
        type: 'success',
        text: res.message || `Magic link sent to ${inviteEmail} with role '${inviteRole}'.`,
      });

      setInviteEmail('');
      setInviteName('');
      setIsInviting(false);
      await loadUsers();
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to dispatch invitation magic link.',
      });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateAdminUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setNotice({
        type: 'success',
        text: `Updated role to '${newRole}' for user.`,
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to update user role.',
      });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Revoke dashboard access for ${email}?`)) return;

    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setNotice({
        type: 'success',
        text: `Access revoked for ${email}.`,
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to remove user.',
      });
    }
  };

  const handleResendMagicLink = async (user: User) => {
    setNotice(null);
    try {
      const res = await inviteAdminUser({
        email: user.email,
        name: user.name,
        role: user.role,
        team: user.team,
      });
      setNotice({
        type: 'success',
        text: `New Supabase Magic Link dispatched to ${user.email}.`,
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to resend magic link.',
      });
    }
  };

  if (!isSuperAdminOrManager) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#181E2C] border border-white/[0.07] rounded-2xl p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-[#FF4B55]/15 text-[#FF4B55] flex items-center justify-center mx-auto border border-[#FF4B55]/30">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Super Admin Access Restricted</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Your current role is <strong className="text-white">({currentUser.role})</strong>. Only designated Super Administrators and Content Managers have access to add users and dispatch Supabase Auth Magic Links.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header Banner */}
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E599]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-1.5 rounded-lg bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                <Crown className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Super Admin Operator Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40">
                RACI ENFORCEMENT
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE] max-w-2xl leading-relaxed">
              Manage operators in your shared ContentOps pipeline. Adding an email triggers an official <strong>Supabase Auth Magic Link</strong> granting direct, secure entry with configured role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadUsers}
              className="p-2 rounded-xl bg-[#121620] hover:bg-[#1f2637] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
              title="Refresh User Directory"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#00E599]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsInviting(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] font-semibold text-xs transition-colors cursor-pointer shadow-lg shadow-[#00E599]/10"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite New Operator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            notice.type === 'success'
              ? 'bg-[#00E599]/10 border-[#00E599]/30 text-[#00E599]'
              : 'bg-[#FF4B55]/10 border-[#FF4B55]/30 text-[#FF4B55]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="hover:opacity-80 text-white cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Invite Modal / Drawer */}
      {isInviting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#00E599]" />
                <h3 className="text-sm font-bold text-white">Invite Operator to Shared Pipeline</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviting(false)}
                className="text-[#8F9CAE] hover:text-white cursor-pointer text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Work Email Address <span className="text-[#00E599]">*</span>
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-[#8F9CAE]" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="specialist@thrill.ai or executive@client.com"
                    className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Operator Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Pipeline Role (Permissions) <span className="text-[#00E599]">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="CREATIVE_SPECIALIST">Creative Specialist</option>
                    <option value="CONTENT_MANAGER">Content Manager</option>
                    <option value="STAKEHOLDER">Stakeholder</option>
                    <option value="DISTRIBUTION_LEAD">Distribution Lead</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Pod / Team Assignment
                  </label>
                  <input
                    type="text"
                    value={inviteTeam}
                    onChange={(e) => setInviteTeam(e.target.value)}
                    placeholder="e.g. Motion Pod 1"
                    className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121620] border border-white/[0.05] text-[11px] text-[#8F9CAE] space-y-1">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#00E599]" />
                  What happens next?
                </span>
                <p>
                  Supabase Auth will immediately send a passwordless <strong>Magic Link</strong> to this email. Upon clicking the link, the user is authenticated directly into the shared Kanban dashboard with the assigned role permissions.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="px-4 py-2 rounded-xl bg-[#121620] hover:bg-white/5 text-[#8F9CAE] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] font-semibold text-xs transition-colors cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingInvite ? 'Dispatching Magic Link...' : 'Send Magic Link Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Users Table */}
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#00E599]" />
            <h3 className="text-sm font-semibold text-white">Active Operator Directory</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-[#8F9CAE] font-mono">
              {users.length} members
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#121620]/60 text-[#8F9CAE] font-semibold">
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Pipeline Role</th>
                <th className="py-3 px-4">Team Pod</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {users.map((u) => {
                const roleMatch = ROLES_INFO.find((r) => r.role === u.role) || ROLES_INFO[2];
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={u.name}
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[10px] font-mono px-1.5 rounded bg-[#00E599]/15 text-[#00E599]">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-[#121620] cursor-pointer focus:outline-none ${roleMatch.badgeClass}`}
                      >
                        <option value="SUPER_ADMIN">Super Administrator</option>
                        <option value="CONTENT_MANAGER">Content Manager</option>
                        <option value="CREATIVE_SPECIALIST">Creative Specialist</option>
                        <option value="STAKEHOLDER">Stakeholder</option>
                        <option value="DISTRIBUTION_LEAD">Distribution Lead</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-[#8F9CAE]">
                      {u.team || u.department || 'Executive Pod'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                          u.status === 'invited'
                            ? 'bg-[#F5A524]/10 text-[#F5A524] border-[#F5A524]/30'
                            : 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30'
                        }`}
                      >
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResendMagicLink(u)}
                          className="px-2 py-1 rounded bg-[#121620] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-[#00E599] border border-white/[0.05] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Resend Supabase Magic Link"
                        >
                          <Send className="h-3 w-3" />
                          <span>Magic Link</span>
                        </button>

                        {u.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1 rounded bg-[#121620] hover:bg-[#FF4B55]/20 text-[#8F9CAE] hover:text-[#FF4B55] border border-white/[0.05] transition-colors cursor-pointer"
                            title="Revoke access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Capabilities & Card Permission Matrix */}
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00E599]" />
          <h3 className="text-sm font-semibold text-white">Pipeline Permission Matrix</h3>
        </div>
        <p className="text-xs text-[#8F9CAE]">
          Each invited user follows strict role permissions to inspect and move cards across pipeline stages:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {ROLES_INFO.map((r) => (
            <div key={r.role} className="bg-[#121620] border border-white/[0.07] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase ${r.badgeClass}`}>
                  {r.title}
                </span>
              </div>
              <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                {r.desc}
              </p>
              <div className="border-t border-white/[0.05] pt-2 space-y-1">
                {r.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <Check className="h-3 w-3 text-[#00E599] shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
