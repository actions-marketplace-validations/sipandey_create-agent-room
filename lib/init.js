'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ask } = require('./prompt');
const { copyDir, copyFile, ensureDir, resolveTemplateSource } = require('./fsutil');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const VALID_TOOLS = ['claude', 'cursor', 'windsurf', 'cline', 'codex', 'git', 'none'];

function parseSafeJSON(str) {
  if (!str || !str.trim()) return {};
  const clean = str.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m));
  return JSON.parse(clean);
}
async function resolveLanguage(args) {
  if (args.language) return args.language;
  if (args.yes || !process.stdin.isTTY) return 'javascript';
  const answer = await ask('Project programming language (default: javascript): ');
  return answer || 'javascript';
}

async function resolvePackageManager(args, language) {
  if (args['package-manager']) return args['package-manager'];
  const defaultPM = (() => {
    const lang = (language || 'javascript').toLowerCase();
    if (lang === 'python') return 'pip';
    if (lang === 'go') return 'go';
    if (lang === 'rust') return 'cargo';
    return 'npm';
  })();
  if (args.yes || !process.stdin.isTTY) return defaultPM;
  const answer = await ask(`Package manager (default: ${defaultPM}): `);
  return answer || defaultPM;
}

async function resolveBranch(args) {
  if (args.branch) return args.branch;
  if (args.yes || !process.stdin.isTTY) return 'main';
  const answer = await ask('Default git branch (default: main): ');
  return answer || 'main';
}

async function resolveSkillPacks(args) {
  if (args['skill-packs']) {
    return args['skill-packs']
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (args.yes || !process.stdin.isTTY) {
    return [];
  }
  const answer = await ask('Optional skill packs to include? (comma-separated: testing,security,release; blank = none): ');
  return answer
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getDerivedCommands(language, packageManager) {
  const lang = (language || 'javascript').toLowerCase();
  const pm = (packageManager || 'npm').toLowerCase();

  let testCommand = `${pm} test`;
  let lintCommand = `${pm} run lint`;

  if (lang === 'typescript' || lang === 'javascript') {
    if (pm === 'npm') {
      testCommand = 'npm test';
      lintCommand = 'npm run lint';
    } else if (pm === 'yarn') {
      testCommand = 'yarn test';
      lintCommand = 'yarn lint';
    } else if (pm === 'pnpm') {
      testCommand = 'pnpm test';
      lintCommand = 'pnpm lint';
    } else if (pm === 'bun') {
      testCommand = 'bun test';
      lintCommand = 'bun lint';
    }
  } else if (lang === 'python') {
    testCommand = 'pytest';
    lintCommand = 'flake8 .';
    if (pm === 'poetry') {
      testCommand = 'poetry run pytest';
      lintCommand = 'poetry run flake8 .';
    } else if (pm === 'pipenv') {
      testCommand = 'pipenv run pytest';
      lintCommand = 'pipenv run flake8 .';
    }
  } else if (lang === 'go') {
    testCommand = 'go test ./...';
    lintCommand = 'golangci-lint run';
  } else if (lang === 'rust') {
    testCommand = 'cargo test';
    lintCommand = 'cargo clippy';
  } else if (lang === 'java' || lang === 'kotlin') {
    if (pm === 'gradle') {
      testCommand = './gradlew test';
      lintCommand = './gradlew checkstyleMain';
    } else {
      testCommand = 'mvn test';
      lintCommand = 'mvn checkstyle:check';
    }
  }

  return { testCommand, lintCommand };
}

function installSkillPacks(target, skillPacks, templatesDir, vars, opts) {
  const results = [];
  const validPacks = ['testing', 'security', 'release'];
  for (const pack of skillPacks) {
    if (!validPacks.includes(pack)) {
      console.warn(`Warning: Unknown skill pack skipped: ${pack}`);
      continue;
    }
    let srcDir = path.join(templatesDir, 'skill-packs', pack);
    if (!fs.existsSync(srcDir)) {
      srcDir = path.join(__dirname, '..', 'templates', 'skill-packs', pack);
    }
    if (fs.existsSync(srcDir)) {
      const destDir = path.join(target, '.agent-room', 'skills');
      results.push(...copyDir(srcDir, destDir, vars, opts));
    }
  }
  return results;
}
async function resolveName(target, args) {
  if (args.name) return args.name;
  const base = path.basename(target);
  if (args.yes || !process.stdin.isTTY) return base;
  const answer = await ask(`Project name (default: ${base}): `);
  return answer || base;
}

async function resolveTools(args) {
  if (args.tools) {
    return args.tools
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (args.yes || !process.stdin.isTTY) {
    return [];
  }
  const answer = await ask(
    'Which agent tools should get adapters? (comma-separated: claude,cursor,windsurf,cline,codex,git; blank = generic AGENTS.md only): '
  );
  return answer
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function gitInit(target) {
  try {
    execFileSync('git', ['init'], { cwd: target, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: target, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'Scaffold project with create-agent-room'], {
      cwd: target,
      stdio: 'ignore',
    });
    return true;
  } catch (err) {
    return false;
  }
}

function mirrorSkillsToClaude(target) {
  const srcDir = path.join(target, '.agent-room', 'skills');
  const results = [];
  if (!fs.existsSync(srcDir)) return results;
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.md')) continue;
    const skillName = file.replace(/\.md$/, '');
    const dest = path.join(target, '.claude', 'skills', skillName, 'SKILL.md');
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, fs.readFileSync(path.join(srcDir, file), 'utf8'));
    results.push({ path: path.relative(target, dest), written: true });
  }
  return results;
}

const STOP_HOOK_COMMAND = 'node .agent-room/hooks/close-the-loop-check.js';

function installCloseTheLoopHook(target, vars, opts) {
  const results = [];

  results.push(
    Object.assign(
      { path: path.join('.agent-room', 'hooks', 'close-the-loop-check.js') },
      copyFile(
        path.join(TEMPLATES_DIR, 'adapters', 'claude-hooks', 'close-the-loop-check.js'),
        path.join(target, '.agent-room', 'hooks', 'close-the-loop-check.js'),
        vars,
        opts
      )
    )
  );

  const settingsPath = path.join(target, '.claude', 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      settings = parseSafeJSON(content);
    } catch (err) {
      console.warn(`Warning: Failed to parse existing .claude/settings.json: ${err.message}. Re-initializing settings.`);
      settings = {};
    }
  }

  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    settings = {};
  }

  settings.hooks = settings.hooks || {};
  settings.hooks.Stop = settings.hooks.Stop || [];

  const alreadyWired = settings.hooks.Stop.some(
    (entry) =>
      Array.isArray(entry.hooks) && entry.hooks.some((h) => h.command === STOP_HOOK_COMMAND)
  );

  if (!alreadyWired) {
    settings.hooks.Stop.push({ hooks: [{ type: 'command', command: STOP_HOOK_COMMAND }] });
    ensureDir(path.dirname(settingsPath));
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    results.push({ path: path.join('.claude', 'settings.json'), written: true });
  } else {
    results.push({
      path: path.join('.claude', 'settings.json'),
      written: false,
      reason: 'already wired',
    });
  }

  return results;
}

function reportResults(results) {
  for (const r of results) {
    if (r.written) console.log(`  created  ${r.path}`);
    else if (r.reason === 'already wired') console.log(`  skipped  ${r.path} (hook already wired)`);
    else console.log(`  skipped  ${r.path} (already exists, use --force to overwrite)`);
  }
}

async function runInit(target, args) {
  ensureDir(target);

  const name = await resolveName(target, args);
  const tools = await resolveTools(args);
  const unknown = tools.filter((t) => !VALID_TOOLS.includes(t));
  if (unknown.length) {
    throw new Error(`Unknown tool(s): ${unknown.join(', ')}. Valid: ${VALID_TOOLS.join(', ')}`);
  }

  let isGit = fs.existsSync(path.join(target, '.git'));
  if (args.git && !isGit) {
    try {
      execFileSync('git', ['init'], { cwd: target, stdio: 'ignore' });
      isGit = true;
    } catch (err) {
      // ignore
    }
  }

  const language = await resolveLanguage(args);
  const packageManager = await resolvePackageManager(args, language);
  const defaultBranch = await resolveBranch(args);
  const skillPacks = await resolveSkillPacks(args);
  const { testCommand, lintCommand } = getDerivedCommands(language, packageManager);

  const templatesDir = resolveTemplateSource(args['template-source']);

  const vars = {
    PROJECT_NAME: name,
    LANGUAGE: language,
    PACKAGE_MANAGER: packageManager,
    'package-manager': packageManager,
    DEFAULT_BRANCH: defaultBranch,
    'default-branch': defaultBranch,
    TEST_COMMAND: testCommand,
    'test-command': testCommand,
    LINT_COMMAND: lintCommand,
    'lint-command': lintCommand
  };
  const opts = { force: !!args.force, root: target };

  console.log(`Scaffolding agent-room structure into ${target}\n`);

  const results = [];

  results.push(
    Object.assign(
      { path: 'AGENTS.md' },
      copyFile(path.join(templatesDir, 'AGENTS.md.tmpl'), path.join(target, 'AGENTS.md'), vars, opts)
    )
  );
  results.push(...copyDir(path.join(templatesDir, '.agent-room'), path.join(target, '.agent-room'), vars, opts));
  results.push(...copyDir(path.join(templatesDir, 'docs'), path.join(target, 'docs'), vars, opts));

  results.push(...installSkillPacks(target, skillPacks, templatesDir, vars, opts));

  const configPath = path.join(target, '.agent-room.json');
  if (!fs.existsSync(configPath) || opts.force) {
    const configData = {
      name,
      tools,
      language,
      packageManager,
      defaultBranch,
      skillPacks
    };
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2) + '\n');
    results.push({ path: '.agent-room.json', written: true });
  } else {
    results.push({ path: '.agent-room.json', written: false, reason: 'exists' });
  }

  if (tools.includes('claude')) {
    results.push(
      Object.assign(
        { path: 'CLAUDE.md' },
        copyFile(
          path.join(templatesDir, 'adapters', 'CLAUDE.md.tmpl'),
          path.join(target, 'CLAUDE.md'),
          vars,
          opts
        )
      )
    );
    results.push(...mirrorSkillsToClaude(target));
    results.push(...installCloseTheLoopHook(target, vars, opts));
  }

  if (tools.includes('cursor')) {
    results.push(
      Object.assign(
        { path: path.join('.cursor', 'rules', 'agent-room.md') },
        copyFile(
          path.join(templatesDir, 'adapters', 'cursorrules.tmpl'),
          path.join(target, '.cursor', 'rules', 'agent-room.md'),
          vars,
          opts
        )
      )
    );
  }

  if (tools.includes('windsurf')) {
    results.push(
      Object.assign(
        { path: '.windsurfrules' },
        copyFile(
          path.join(templatesDir, 'adapters', 'windsurfrules.tmpl'),
          path.join(target, '.windsurfrules'),
          vars,
          opts
        )
      )
    );
  }

  if (tools.includes('cline')) {
    results.push(
      Object.assign(
        { path: '.clinerules' },
        copyFile(
          path.join(templatesDir, 'adapters', 'clinerules.tmpl'),
          path.join(target, '.clinerules'),
          vars,
          opts
        )
      )
    );
  }

  if (tools.includes('git') && isGit) {
    const hookDest = path.join(target, '.git', 'hooks', 'pre-commit');
    results.push(
      Object.assign(
        { path: '.git/hooks/pre-commit' },
        copyFile(
          path.join(templatesDir, 'adapters', 'git-hooks', 'pre-commit.tmpl'),
          hookDest,
          vars,
          opts
        )
      )
    );
    try {
      fs.chmodSync(hookDest, '755');
    } catch (err) {
      // Ignore if chmod fails (e.g. on Windows)
    }
  } else if (tools.includes('git') && !isGit) {
    console.warn('\nWarning: Git adapter requested but target is not a git repository. Skipping pre-commit hook.');
  }

  reportResults(results);

  if (args.git) {
    const ok = gitInit(target);
    console.log(
      ok
        ? '\nInitialized git repo and created initial commit.'
        : '\nGit init/commit skipped (already a repo, nothing to commit, or git unavailable).'
    );
  }

  console.log(`\nDone. Start by reading ${path.join(target, 'AGENTS.md')}.`);
}

module.exports = { runInit, mirrorSkillsToClaude, VALID_TOOLS, parseSafeJSON };
