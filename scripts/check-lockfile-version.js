#!/usr/bin/env node
'use strict';

// package-lock.json has gone stale relative to package.json's version twice
// before (see .agent-room/anti-patterns.md, 2026-07-09) - `npm install` is a
// no-op when dependencies haven't changed, so a version bump that skips it
// drifts silently until someone happens to diff the two files. This is a
// cheap CI gate against that specific, recurring mistake.

const path = require('path');

const pkg = require(path.join('..', 'package.json'));
const lock = require(path.join('..', 'package-lock.json'));

const mismatches = [];

if (lock.version !== pkg.version) {
  mismatches.push(`package-lock.json's top-level "version" is ${lock.version}, package.json's is ${pkg.version}`);
}

const rootPackageEntry = lock.packages && lock.packages[''];
if (rootPackageEntry && rootPackageEntry.version !== pkg.version) {
  mismatches.push(`package-lock.json's packages[""].version is ${rootPackageEntry.version}, package.json's is ${pkg.version}`);
}

if (mismatches.length > 0) {
  console.error('package-lock.json is out of sync with package.json:');
  for (const m of mismatches) {
    console.error(`  - ${m}`);
  }
  console.error('\nRun `npm install` after bumping package.json\'s version to regenerate the lockfile.');
  process.exit(1);
}

console.log(`package-lock.json version matches package.json (${pkg.version}).`);
