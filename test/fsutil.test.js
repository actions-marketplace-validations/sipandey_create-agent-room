'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { renderTemplate, stripTmplExt, copyFile, resolveTemplateSource } = require('../lib/fsutil');

test('renderTemplate supports standard and dash variables', () => {
  const template = 'Hello {{PROJECT_NAME}}! We use {{package-manager}} with {{repo-name}}.';
  const result = renderTemplate(template, {
    PROJECT_NAME: 'Antigravity',
    'package-manager': 'npm',
    'repo-name': 'my-repo'
  });
  assert.strictEqual(result, 'Hello Antigravity! We use npm with my-repo.');
});

test('stripTmplExt', () => {
  assert.strictEqual(stripTmplExt('test.tmpl'), 'test');
  assert.strictEqual(stripTmplExt('test.js'), 'test.js');
});

test('copyFile rendering', () => {
  const tmpDir = path.join(__dirname, 'tmp-test-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  const src = path.join(tmpDir, 'source.tmpl');
  const dest = path.join(tmpDir, 'dest.txt');

  fs.writeFileSync(src, 'Project: {{PROJECT_NAME}}');

  try {
    const res = copyFile(src, dest, { PROJECT_NAME: 'CreateAgentRoom' });
    assert.strictEqual(res.written, true);
    assert.strictEqual(fs.existsSync(dest), true);
    assert.strictEqual(fs.readFileSync(dest, 'utf8'), 'Project: CreateAgentRoom');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('resolveTemplateSource resolution', () => {
  // Test invalid path throws
  assert.throws(() => resolveTemplateSource(path.join(__dirname, 'non-existent-dir')), /Error: Specified template source directory does not exist/);

  // Test fallback to package templates if no custom path
  const defaultDir = resolveTemplateSource();
  assert.strictEqual(fs.existsSync(defaultDir), true);
  assert.strictEqual(fs.existsSync(path.join(defaultDir, 'AGENTS.md.tmpl')), true);
});
