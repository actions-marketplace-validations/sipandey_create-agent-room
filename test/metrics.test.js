'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { parseMarkdownSession, parseJSONSession, runMetrics } = require('../lib/metrics');

test('parseMarkdownSession: correctly parses markdown session log details', () => {
  const tmpDir = path.join(__dirname, 'tmp-test-md-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'session1.md');

  const logContent = `
# Session Log: Fix OAuth Timeout

**Date:** 2025-03-15 10:30
**Agent:** Claude Code v1.0
**Classification:** Bug

## Goal
Fix oauth timeouts when calling auth service.

## Files touched
- Read: lib/auth.js, test/auth.test.js
- Created: none
- Modified: lib/auth.js

## Outcome
Completed
  `;

  fs.writeFileSync(filePath, logContent);

  const stats = {
    total: 0,
    classifications: { Bug: 0, Enhancement: 0, Feature: 0, Product: 0 },
    outcomes: { Completed: 0, Blocked: 0, 'Handed Off': 0 },
    agents: {},
    filesRead: 0,
    filesCreated: 0,
    filesModified: 0
  };

  parseMarkdownSession(filePath, stats);

  assert.strictEqual(stats.total, 1);
  assert.strictEqual(stats.classifications.Bug, 1);
  assert.strictEqual(stats.outcomes.Completed, 1);
  assert.strictEqual(stats.agents['Claude Code v1.0'], 1);
  assert.strictEqual(stats.filesRead, 2);
  assert.strictEqual(stats.filesCreated, 0);
  assert.strictEqual(stats.filesModified, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('parseJSONSession: correctly parses JSON session log details', () => {
  const tmpDir = path.join(__dirname, 'tmp-test-json-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'session1.json');

  const jsonData = {
    date: '2025-03-16 11:15',
    agent: 'Cursor Composer',
    classification: 'Feature',
    outcome: 'Blocked',
    filesTouched: {
      read: ['lib/users.js', 'lib/billing.js'],
      created: 1,
      modified: 'lib/users.js'
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(jsonData));

  const stats = {
    total: 0,
    classifications: { Bug: 0, Enhancement: 0, Feature: 0, Product: 0 },
    outcomes: { Completed: 0, Blocked: 0, 'Handed Off': 0 },
    agents: {},
    filesRead: 0,
    filesCreated: 0,
    filesModified: 0
  };

  parseJSONSession(filePath, stats);

  assert.strictEqual(stats.total, 1);
  assert.strictEqual(stats.classifications.Feature, 1);
  assert.strictEqual(stats.outcomes.Blocked, 1);
  assert.strictEqual(stats.agents['Cursor Composer'], 1);
  assert.strictEqual(stats.filesRead, 2);
  assert.strictEqual(stats.filesCreated, 1);
  assert.strictEqual(stats.filesModified, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('runMetrics: handles missing and empty session directory gracefully', (t) => {
  const tmpDir = path.join(__dirname, 'tmp-metrics-run-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Intercept console.log
  const originalLog = console.log;
  let logOutput = '';
  console.log = (msg) => {
    logOutput += msg + '\n';
  };

  try {
    // 1. Missing .agent-room/sessions/
    runMetrics(tmpDir);
    assert.match(logOutput, /No sessions directory found/);

    // Reset log output
    logOutput = '';

    // Create empty sessions directory
    fs.mkdirSync(path.join(tmpDir, '.agent-room', 'sessions'), { recursive: true });
    runMetrics(tmpDir);
    assert.match(logOutput, /No session logs found/);
  } finally {
    console.log = originalLog;
  }
});
