'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { runSync } = require('../lib/sync');

test('runSync: syncs skills from agent-room to claude using .agent-room.json', (t) => {
  const tmpDir = path.join(__dirname, 'tmp-sync-project-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Setup agent-room skills and config
  const agentRoomDir = path.join(tmpDir, '.agent-room', 'skills');
  fs.mkdirSync(agentRoomDir, { recursive: true });
  fs.writeFileSync(path.join(agentRoomDir, 'my-skill.md'), '# My Skill');

  const configPath = path.join(tmpDir, '.agent-room.json');
  fs.writeFileSync(configPath, JSON.stringify({ tools: ['claude'] }));

  // Run sync
  runSync(tmpDir);

  // Assert mirrored skill is updated
  const mirroredSkill = path.join(tmpDir, '.claude', 'skills', 'my-skill', 'SKILL.md');
  assert.strictEqual(fs.existsSync(mirroredSkill), true, 'Claude mirrored skill should exist');
  assert.strictEqual(fs.readFileSync(mirroredSkill, 'utf8'), '# My Skill');
});
