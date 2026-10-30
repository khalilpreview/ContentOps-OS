import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateWithEmail, authenticateWithGoogle } from './auth';

test('Email authentication matches seed user when matching email is used', async () => {
  const session = await authenticateWithEmail('elena.vance@enterprise.io');
  assert.equal(session.user.name, 'Elena Vance');
  assert.equal(session.user.role, 'CONTENT_MANAGER');
  assert.equal(session.provider, 'email');
  assert.ok(session.token);
});

test('Email authentication creates new test user for custom test email', async () => {
  const session = await authenticateWithEmail('qa.engineer@enterprise.io', 'CREATIVE_SPECIALIST', 'QA Tester');
  assert.equal(session.user.email, 'qa.engineer@enterprise.io');
  assert.equal(session.user.role, 'CREATIVE_SPECIALIST');
  assert.equal(session.user.name, 'QA Tester');
});

test('Google authentication assigns Google SSO provider and valid session', async () => {
  const session = await authenticateWithGoogle('executive@gmail.com', 'Alex Rivera');
  assert.equal(session.provider, 'google');
  assert.equal(session.user.email, 'executive@gmail.com');
  assert.equal(session.user.name, 'Alex Rivera');
  assert.ok(session.token);
});
