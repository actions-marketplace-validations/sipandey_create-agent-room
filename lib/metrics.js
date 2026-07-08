'use strict';

const fs = require('fs');
const path = require('path');
const { green, yellow, red, cyan, bold } = require('./color');

function countFiles(str) {
  if (!str) return 0;
  const clean = str.trim().replace(/\[|\]/g, '');
  if (/^(none|blank|n\/a|list of.*|placeholder)$/i.test(clean)) return 0;
  const items = clean.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length;
}

function parseFileList(val) {
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return countFiles(val);
  return 0;
}

function parseMarkdownSession(filePath, stats) {
  const content = fs.readFileSync(filePath, 'utf8');
  stats.total++;

  // Regex matches
  const agentMatch = content.match(/\*\*Agent:\*\*\s*(.+)/i);
  const classMatch = content.match(/\*\*Classification:\*\*\s*(.+)/i);

  // Parse Outcome
  let outcome = 'Handed Off';
  const outcomeHeaderMatch = content.match(/## Outcome\s*\n+([^\n#\s]+[^\n#]*)/i);
  if (outcomeHeaderMatch) {
    const parsed = outcomeHeaderMatch[1].trim();
    if (/completed/i.test(parsed)) outcome = 'Completed';
    else if (/blocked/i.test(parsed)) outcome = 'Blocked';
    else if (/handed/i.test(parsed)) outcome = 'Handed Off';
  }
  stats.outcomes[outcome]++;

  if (classMatch) {
    const val = classMatch[1].trim();
    let matchedClass = null;
    if (/bug/i.test(val)) matchedClass = 'Bug';
    else if (/enhancement/i.test(val)) matchedClass = 'Enhancement';
    else if (/feature/i.test(val)) matchedClass = 'Feature';
    else if (/product/i.test(val)) matchedClass = 'Product';

    if (matchedClass) {
      stats.classifications[matchedClass]++;
    }
  }

  if (agentMatch) {
    const agent = agentMatch[1].trim().replace(/\[|\]/g, '');
    stats.agents[agent] = (stats.agents[agent] || 0) + 1;
  }

  // Parse Files touched
  const readMatch = content.match(/-\s*Read:\s*(.+)/i);
  const createdMatch = content.match(/-\s*Created:\s*(.+)/i);
  const modifiedMatch = content.match(/-\s*Modified:\s*(.+)/i);

  if (readMatch) stats.filesRead += countFiles(readMatch[1]);
  if (createdMatch) stats.filesCreated += countFiles(createdMatch[1]);
  if (modifiedMatch) stats.filesModified += countFiles(modifiedMatch[1]);
}

function parseJSONSession(filePath, stats) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  stats.total++;

  if (data.classification) {
    const val = data.classification;
    if (stats.classifications[val] !== undefined) {
      stats.classifications[val]++;
    }
  }
  if (data.outcome) {
    let outcome = 'Handed Off';
    if (/completed/i.test(data.outcome)) outcome = 'Completed';
    else if (/blocked/i.test(data.outcome)) outcome = 'Blocked';
    stats.outcomes[outcome]++;
  } else {
    stats.outcomes['Handed Off']++;
  }
  if (data.agent) {
    stats.agents[data.agent] = (stats.agents[data.agent] || 0) + 1;
  }
  if (data.filesTouched) {
    if (data.filesTouched.read) stats.filesRead += parseFileList(data.filesTouched.read);
    if (data.filesTouched.created) stats.filesCreated += parseFileList(data.filesTouched.created);
    if (data.filesTouched.modified) stats.filesModified += parseFileList(data.filesTouched.modified);
  }
}

function printDashboard(stats) {
  const t = stats.total;
  const pct = (val) => (t > 0 ? ((val / t) * 100).toFixed(1) : '0.0');

  const bar = (val) => {
    if (t === 0) return '[                    ]';
    const fillCount = Math.round((val / t) * 20);
    const fill = '='.repeat(Math.max(0, fillCount - 1)) + (fillCount > 0 ? '>' : '');
    const empty = ' '.repeat(20 - fillCount);
    return `[${fill}${empty}]`;
  };

  console.log(bold('======================================================'));
  console.log(bold('              Agent Session Dashboard'));
  console.log(bold('======================================================'));
  console.log(`Total Sessions Logged: ${cyan(t)}\n`);

  console.log(bold('--- Outcomes Success Rate ---'));
  console.log(`Completed:  ${green(bar(stats.outcomes.Completed))} ${pct(stats.outcomes.Completed)}% (${stats.outcomes.Completed})`);
  console.log(`Blocked:    ${red(bar(stats.outcomes.Blocked))} ${pct(stats.outcomes.Blocked)}% (${stats.outcomes.Blocked})`);
  console.log(`Handed Off: ${yellow(bar(stats.outcomes['Handed Off']))} ${pct(stats.outcomes['Handed Off'])}% (${stats.outcomes['Handed Off']})\n`);

  console.log(bold('--- Classification Distribution ---'));
  console.log(`Bug:         ${stats.classifications.Bug} (${pct(stats.classifications.Bug)}%)`);
  console.log(`Enhancement: ${stats.classifications.Enhancement} (${pct(stats.classifications.Enhancement)}%)`);
  console.log(`Feature:     ${stats.classifications.Feature} (${pct(stats.classifications.Feature)}%)`);
  console.log(`Product:     ${stats.classifications.Product} (${pct(stats.classifications.Product)}%)\n`);

  console.log(bold('--- Agent Breakdown ---'));
  const agentsSorted = Object.entries(stats.agents).sort((a, b) => b[1] - a[1]);
  if (agentsSorted.length === 0) {
    console.log('No agent information logged.');
  } else {
    for (const [agent, count] of agentsSorted) {
      console.log(`- ${agent}: ${count} session(s)`);
    }
  }
  console.log('');

  console.log(bold('--- File Volumes ---'));
  console.log(`Files Read:     ${stats.filesRead}`);
  console.log(`Files Created:  ${stats.filesCreated}`);
  console.log(`Files Modified: ${stats.filesModified}`);
  console.log(bold('======================================================'));
}

function runMetrics(target) {
  const sessionsDir = path.join(target, '.agent-room', 'sessions');
  if (!fs.existsSync(sessionsDir) || !fs.statSync(sessionsDir).isDirectory()) {
    console.log(yellow(`No sessions directory found at ${path.relative(process.cwd(), sessionsDir)}`));
    console.log('Ensure agents have logged sessions under .agent-room/sessions/ first.');
    return;
  }

  const files = fs.readdirSync(sessionsDir).filter(
    (f) => (f.endsWith('.md') || f.endsWith('.json')) && f !== '.gitkeep'
  );
  if (files.length === 0) {
    console.log(yellow('No session logs found.'));
    return;
  }

  const stats = {
    total: 0,
    classifications: { Bug: 0, Enhancement: 0, Feature: 0, Product: 0 },
    outcomes: { Completed: 0, Blocked: 0, 'Handed Off': 0 },
    agents: {},
    filesRead: 0,
    filesCreated: 0,
    filesModified: 0
  };

  for (const file of files) {
    const fullPath = path.join(sessionsDir, file);
    try {
      if (file.endsWith('.json')) {
        parseJSONSession(fullPath, stats);
      } else {
        parseMarkdownSession(fullPath, stats);
      }
    } catch (err) {
      console.warn(yellow(`Warning: Failed to parse session log ${file}: ${err.message}`));
    }
  }

  printDashboard(stats);
}

module.exports = {
  runMetrics,
  parseMarkdownSession,
  parseJSONSession
};
