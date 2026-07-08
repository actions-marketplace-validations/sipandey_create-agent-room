'use strict';

const fs = require('fs');
const path = require('path');

function syncSkillsToClaude(target) {
  const srcDir = path.join(target, '.agent-room', 'skills');
  const results = [];
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.md')) continue;
    const skillName = file.replace(/\.md$/, '');
    const dest = path.join(target, '.claude', 'skills', skillName, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(path.join(srcDir, file), 'utf8'));
    results.push({ path: path.relative(target, dest) });
  }
  return results;
}

function runSync(target) {
  const configPath = path.join(target, '.agent-room.json');
  let tools = [];
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config && Array.isArray(config.tools)) {
        tools = config.tools;
      }
    } catch (err) {
      console.warn(`Warning: Failed to parse .agent-room.json: ${err.message}`);
    }
  }

  const agentRoomDir = path.join(target, '.agent-room', 'skills');
  if (!fs.existsSync(agentRoomDir)) {
    throw new Error(`No .agent-room/skills/ found in ${target} - run "create-agent-room init" first.`);
  }

  if (tools.length === 0) {
    if (fs.existsSync(path.join(target, 'CLAUDE.md')) || fs.existsSync(path.join(target, '.claude'))) {
      tools.push('claude');
    }
  }

  if (tools.includes('claude')) {
    const results = syncSkillsToClaude(target);
    for (const r of results) {
      console.log(`  synced  ${r.path}`);
    }
    console.log('\nSynced .agent-room/skills/* into .claude/skills/* (source of truth is .agent-room/skills/).');
  } else {
    console.log('No tools requiring sync found in project configuration - nothing to sync.');
  }
}

module.exports = { runSync, syncSkillsToClaude };
