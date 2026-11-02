import test from 'node:test';
import assert from 'node:assert/strict';
import {
  logInfo,
  logWarn,
  logError,
  logFatal,
  setUserContext,
  getUserContext,
  getRecentLogs,
  clearRecentLogs,
  extractErrorInfo,
  safeSerialize
} from './logger';

test('extractErrorInfo: extracts message and stack trace from Error instance', () => {
  const customErr = new Error('Test production failure');
  const extracted = extractErrorInfo(customErr);

  assert.equal(extracted.message, 'Test production failure');
  assert.ok(extracted.stack && extracted.stack.includes('Test production failure'));
});

test('extractErrorInfo: extracts message from raw string and sets stack to null', () => {
  const extracted = extractErrorInfo('Network timeout reaching CDN deliverable');

  assert.equal(extracted.message, 'Network timeout reaching CDN deliverable');
  assert.equal(extracted.stack, null);
});

test('extractErrorInfo: safely parses object with error message property', () => {
  const extracted = extractErrorInfo({ error: 'Database connection dropped' });

  assert.equal(extracted.message, 'Database connection dropped');
  assert.equal(extracted.stack, null);
});

test('extractErrorInfo: handles null and undefined inputs gracefully', () => {
  assert.equal(extractErrorInfo(null).message, 'Unknown error');
  assert.equal(extractErrorInfo(undefined).message, 'Unknown error');
});

test('safeSerialize: handles circular references without throwing', () => {
  const circularObj: any = { name: 'Thrill Ops Test' };
  circularObj.self = circularObj;

  const result = safeSerialize(circularObj);
  assert.equal(result.name, 'Thrill Ops Test');
  assert.equal(result.self, '[Circular Reference]');
});

test('safeSerialize: serializes Error objects embedded in metadata context', () => {
  const err = new TypeError('Invalid mime-type video/avi');
  const result = safeSerialize({ cause: err, assetId: 'asset-101' });

  assert.equal(result.assetId, 'asset-101');
  assert.equal((result.cause as any).message, 'Invalid mime-type video/avi');
});

test('setUserContext and getUserContext: manages active operator telemetry session', () => {
  setUserContext('u-operator-99', 'CONTENT_MANAGER');
  const ctx = getUserContext();

  assert.equal(ctx.userId, 'u-operator-99');
  assert.equal(ctx.userRole, 'CONTENT_MANAGER');

  setUserContext(null, null);
  const cleared = getUserContext();
  assert.equal(cleared.userId, null);
  assert.equal(cleared.userRole, null);
});

test('Structured Logging: logInfo, logWarn, logError, logFatal produce compliant LogRecord', () => {
  clearRecentLogs();
  setUserContext('u-analyst-1', 'STAKEHOLDER');

  const infoLog = logInfo('contentops_intake_viewed', 'User viewed intake drawer', { tab: 'brief' });
  assert.equal(infoLog.level, 'info');
  assert.equal(infoLog.event, 'contentops_intake_viewed');
  assert.equal(infoLog.message, 'User viewed intake drawer');
  assert.equal(infoLog.user_id, 'u-analyst-1');
  assert.equal(infoLog.user_role, 'STAKEHOLDER');
  assert.ok(infoLog.created_at);

  const warnLog = logWarn('sla_warning_threshold', 'Asset has 4 hours remaining', { slaHours: 4 });
  assert.equal(warnLog.level, 'warn');
  assert.equal(warnLog.event, 'sla_warning_threshold');

  const errorLog = logError('state_transition_blocked', new Error('Missing 4-point QA signoff'));
  assert.equal(errorLog.level, 'error');
  assert.equal(errorLog.message, 'Missing 4-point QA signoff');
  assert.ok(errorLog.stack);

  const fatalLog = logFatal('react_error_boundary', new Error('Critical component crash'));
  assert.equal(fatalLog.level, 'fatal');
  assert.equal(fatalLog.message, 'Critical component crash');

  const logs = getRecentLogs();
  assert.equal(logs.length, 4);
  assert.equal(logs[0].event, 'contentops_intake_viewed');
  assert.equal(logs[3].event, 'react_error_boundary');
});

test('Ring buffer: clearRecentLogs empties buffer safely', () => {
  logInfo('test_event', 'Sample');
  assert.ok(getRecentLogs().length > 0);

  clearRecentLogs();
  assert.equal(getRecentLogs().length, 0);
});
