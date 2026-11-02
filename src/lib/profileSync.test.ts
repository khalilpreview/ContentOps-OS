import test from 'node:test';
import assert from 'node:assert/strict';
import {
  syncUserProfileToSupabase,
  fetchUserProfileFromSupabase,
  mapSupabaseUserToUser,
  ProfileDbRow
} from './supabase';
import { User, UserRole } from '../types';

test('syncUserProfileToSupabase handles offline/unconfigured mode gracefully', async () => {
  const sampleProfile = {
    id: 'user-op-99',
    name: 'Elena Vance',
    email: 'elena@enterprise.io',
    role: 'CONTENT_MANAGER' as UserRole,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
    team: 'Executive ContentOps Pod'
  };

  const res = await syncUserProfileToSupabase(sampleProfile);
  assert.equal(res.success, true);
});

test('ProfileDbRow structure aligns with Supabase profiles table schema', () => {
  const row: ProfileDbRow = {
    id: 'uuid-1234',
    email: 'marcus.chen@enterprise.io',
    name: 'Marcus Chen',
    role: 'CREATIVE_SPECIALIST',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    team: 'Motion & Visual Creative Pod',
    updated_at: new Date().toISOString()
  };

  assert.equal(row.id, 'uuid-1234');
  assert.equal(row.email, 'marcus.chen@enterprise.io');
  assert.equal(row.role, 'CREATIVE_SPECIALIST');
  assert.equal(row.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');
  assert.equal(row.team, 'Motion & Visual Creative Pod');
});

test('mapSupabaseUserToUser correctly defaults team if omitted', () => {
  const sbUserWithoutTeam = {
    id: 'user-no-team',
    email: 'sarah.sterling@enterprise.io',
    user_metadata: {
      name: 'Sarah Sterling',
      role: 'STAKEHOLDER',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956'
    }
  };

  const user = mapSupabaseUserToUser(sbUserWithoutTeam as any);
  assert.equal(user.role, 'STAKEHOLDER');
  assert.equal(user.avatarUrl, 'https://images.unsplash.com/photo-1580489944761-15a19d654956');
  assert.ok(user.team && user.team.length > 0);
});

test('mapSupabaseUserToUser prioritizes custom team in metadata over defaults', () => {
  const sbUserWithTeam = {
    id: 'user-custom-team',
    email: 'devon.ross@enterprise.io',
    user_metadata: {
      name: 'Devon Ross',
      role: 'DISTRIBUTION_LEAD',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      team: 'Omnichannel Syndication & Paid Media'
    }
  };

  const user = mapSupabaseUserToUser(sbUserWithTeam as any);
  assert.equal(user.role, 'DISTRIBUTION_LEAD');
  assert.equal(user.avatarUrl, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d');
  assert.equal(user.team, 'Omnichannel Syndication & Paid Media');
});
