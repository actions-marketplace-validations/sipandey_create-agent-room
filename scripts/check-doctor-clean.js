#!/usr/bin/env node
'use strict';

// This repo's own scaffolded/dogfooded files (git hooks, guardrails.json,
// the CI version pin) have drifted from already-fixed templates three
// times now, silently - doctor() correctly stays advisory for end users
// (a scaffolded room might be legitimately customized), so nothing ever
// re-checks THIS repo specifically. This is a project-specific CI gate,
// not a change to doctor's own (always-zero) exit code for end users -
// see .agent-room/decisions.md, 2026-07-14.

const path = require('path');
const { getFindings } = require(path.join('..', 'lib', 'doctor'));

const target = path.join(__dirname, '..');
const { critical, advisory } = getFindings(target);

if (critical.length > 0 || advisory.length > 0) {
  console.error("This repo's own `create-agent-room doctor .` is not clean:");
  for (const c of critical) {
    console.error(`  - ${c}`);
  }
  for (const a of advisory) {
    console.error(`  - ${a}`);
  }
  console.error('\nRun `create-agent-room doctor .` locally for the full report.');
  process.exit(1);
}

console.log('create-agent-room doctor . reports no findings for this repo.');
