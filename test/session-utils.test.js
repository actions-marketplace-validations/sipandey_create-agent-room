'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { createLog, SessionLog, generateTimestamp } = require('../lib/session-utils');

test('createLog: creates a new session log', () => {
  const log = createLog({
    goal: 'Add API endpoint',
    classification: 'Feature',
    agent: 'Claude 3.5',
    topic: 'api-endpoint'
  });

  assert(log instanceof SessionLog);
  assert.strictEqual(log.goal, 'Add API endpoint');
  assert.strictEqual(log.classification, 'Feature');
  assert.strictEqual(log.agent, 'Claude 3.5');
});

test('SessionLog: builds session log with fluent API', () => {
  const log = createLog({
    goal: 'Fix login bug',
    classification: 'Bug'
  });

  log
    .addAction('Reproduced the bug in auth.test.js')
    .addAction('Found timeout in token validation')
    .addAction('Increased timeout and verified fix')
    .addFile('read', 'lib/auth.js')
    .addFile('modified', 'lib/auth.js')
    .addFile('modified', 'test/auth.test.js')
    .addDecision('Use 5s timeout instead of 1s')
    .setTests('npm test', 'Passed: 12 passed, 0 failed')
    .complete('Ready for review');

  assert.strictEqual(log.actions.length, 3);
  assert.strictEqual(log.files.modified.length, 2);
  assert.strictEqual(log.decisions.length, 1);
  assert.strictEqual(log.outcome, 'Completed');
});

test('SessionLog: converts to markdown', () => {
  const log = createLog({
    goal: 'Add feature',
    classification: 'Feature',
    agent: 'Test Agent',
    topic: 'test-feature'
  });

  log.addAction('Step 1')
    .addFile('created', 'file.js')
    .addDecision('Use approach A')
    .setTests('npm test', 'Passed');

  const markdown = log.toMarkdown();

  assert(markdown.includes('# Session Log: test-feature'));
  assert(markdown.includes('**Agent:** Test Agent'));
  assert(markdown.includes('**Classification:** Feature'));
  assert(markdown.includes('## Goal'));
  assert(markdown.includes('Add feature'));
  assert(markdown.includes('1. Step 1'));
  assert(markdown.includes('- Created: file.js'));
  assert(markdown.includes('- Use approach A'));
});

test('SessionLog: converts to JSON', () => {
  const log = createLog({
    goal: 'Test goal',
    classification: 'Enhancement'
  });

  log.addAction('Action 1').addFile('created', 'new.js');

  const json = log.toJSON();

  assert.strictEqual(json.goal, 'Test goal');
  assert.strictEqual(json.classification, 'Enhancement');
  assert.strictEqual(json.actions.length, 1);
  assert.strictEqual(json.files.created.length, 1);
});

test('SessionLog: marks as handoff', () => {
  const log = createLog({ goal: 'Partial work' });

  log.handOff('Needs database schema approval');

  assert.strictEqual(log.outcome, 'Handed Off');
  assert.strictEqual(log.handoffNote, 'Needs database schema approval');
});

test('generateTimestamp: creates valid timestamp', () => {
  const ts = generateTimestamp();

  assert(typeof ts === 'string');
  assert(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/.test(ts), `Timestamp format invalid: ${ts}`);
});

test('SessionLog: saves to file', () => {
  const tmpDir = path.join(__dirname, 'tmp-session-utils-' + Date.now());
  const agentRoomDir = path.join(tmpDir, '.agent-room');
  const sessionsDir = path.join(agentRoomDir, 'sessions');

  fs.mkdirSync(sessionsDir, { recursive: true });

  // Override cwd for this test
  const originalCwd = process.cwd;
  process.cwd = () => tmpDir;

  try {
    const log = createLog({
      goal: 'Test saving',
      topic: 'test-save'
    });

    log.addAction('Tested').setTests('npm test', 'Passed');

    const result = log.save('markdown');

    assert(fs.existsSync(result.path), `Session file not created at ${result.path}`);

    const content = fs.readFileSync(result.path, 'utf8');
    assert(content.includes('# Session Log: test-save'));
    assert(content.includes('## Goal'));
    assert(content.includes('Test saving'));
  } finally {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('SessionLog: saves to JSON', () => {
  const tmpDir = path.join(__dirname, 'tmp-session-json-' + Date.now());
  const agentRoomDir = path.join(tmpDir, '.agent-room');
  const sessionsDir = path.join(agentRoomDir, 'sessions');

  fs.mkdirSync(sessionsDir, { recursive: true });

  const originalCwd = process.cwd;
  process.cwd = () => tmpDir;

  try {
    const log = createLog({
      goal: 'Test JSON',
      topic: 'test-json'
    });

    log.addAction('Tested').setTests('npm test', 'Passed');

    const result = log.save('json');

    assert(fs.existsSync(result.path), `Session file not created at ${result.path}`);

    const content = JSON.parse(fs.readFileSync(result.path, 'utf8'));
    assert.strictEqual(content.goal, 'Test JSON');
    assert.strictEqual(content.actions.length, 1);
  } finally {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
