# create-agent-room

Scaffold an LLM-agent-friendly project structure and governance framework into any new or existing project. 

`create-agent-room` provides a generic `AGENTS.md` entry point, a principles playbook, a workflow classifier, anti-patterns/decisions logs, and custom multi-agent coordination protocols. It also supports optional thin adapters for Claude Code, Cursor, Windsurf, Cline, and Git to mechanically enforce quality and governance.

---

## Features

- **Multi-Agent Coordination**: Scaffolds guidelines for handoffs, scope boundaries, and structured session logs.
- **Agent Guardrails**: Defines protected paths, require-approval rules, and forbidden actions via `guardrails.json`.
- **Inheritance & Composition**: Composes templates sequentially from base structures, stack-specific files (e.g. Python, React), org-specific conventions (`--org <name>`), and project overrides.
- **Built-in & External Skill Packs**: Standard templates (testing, security, database-migrations, api-design, code-review, performance, observability, docs) or remote skill packs directly from Git repositories and local paths.
- **CI Room Validation**: Lint skill YAML frontmatter headers and verify guardrail schemas in your CI/CD pipelines.
- **Observability Metrics Dashboard**: Parse and compile analytics (success rates, classifications, file modifications volumes) from agent session logs.
- **PR Description Generator**: Automatically extract Goal, Touched Files, Actions, and Handoff notes from the latest session log to generate standard Pull Request descriptions.

---

## Usage

```bash
# Initialize a new project with all tool adapters, git initialization, and specific skill packs:
node bin/cli.js init ../my-project --tools claude,cursor,git --git --skill-packs testing,security,observability

# Scaffolding using template inheritance (Base -> Python stack -> Acme Org rules):
node bin/cli.js init . --yes --language python --org acme

# Fetching skill packs dynamically from a remote git repository:
node bin/cli.js init . --yes --skill-packs https://github.com/my-org/custom-skills.git

# Run integrity validation on the room (exits with code 1 if files are missing or skill frontmatter is malformed):
node bin/cli.js validate .

# Generate an observability report dashboard based on session logs:
node bin/cli.js metrics .

# Generate a Pull Request description from the latest session log and save it:
node bin/cli.js pr-desc . --write
```

Once published to npm, the same commands work via `npx`:

```bash
npx create-agent-room init my-new-project
npx create-agent-room validate .
npx create-agent-room metrics .
npx create-agent-room pr-desc . --write
```

---

## Directory Structure

```
AGENTS.md                          Generic entry point read by any agent
.agent-room/
  principles.md                    12 playbooks for reliable LLM output
  workflow-classifier.md           Bug / Enhancement / Feature / Product routing
  guardrails.md                    Prose boundaries and constraints (what not to do)
  guardrails.json                  Machine-readable guardrail rule schema
  anti-patterns.md                 Append-only negative-knowledge log (starts empty)
  decisions.md                     Append-only decisions log (starts empty)
  skills/
    brainstorming.md               Brainstorming rules, hard-gated
    writing-plans.md               Design-to-task plan blueprints
    test-driven-development.md     TDD red-green-refactor loop
    systematic-debugging.md        Root-cause analysis protocols
    verification-before-completion.md   Double-checking results before completion
    closing-the-loop.md            Closing out decisions and anti-patterns
    [skill packs]                  observability.md, api-design.md, database-migrations.md, etc.
  coordination/
    handoff-protocol.md            Protocols for serializing state between sessions
    scope-boundaries.md            Resource ownership guidelines
    session-log-format.md          Layout template for writing session logs
  sessions/                        Directory where session logs get saved
docs/plans/                        Where design docs and task plans get saved
.agent-room.json                   Project config tracking language, tools, branch, and skill packs
```

---

## Subcommands

### 1. `init [target-dir]`
Scaffold the agent workspace. If files already exist in the target, they are skipped by default to protect manual edits unless `--force` is specified.

### 2. `sync [target-dir]`
Synchronize custom rules from `.agent-room/skills/` directly to `.claude/skills/` mirrors.
* Run with `--check` to verify if mirrored rule files are out of date without rewriting them.
* Sync will automatically skip overwriting files if they have uncommitted manual edits, unless `--force` is used.

### 3. `validate [target-dir]`
Performs structural validation and linting on the room. Returns exit code `1` on error:
* Asserts presence of all mandatory files and folders (e.g. `AGENTS.md`, `guardrails.md`).
* Lints skill files under `.agent-room/skills/*.md` to ensure they contain Jekyll-style frontmatter headers (`---`) with valid `name` and `description` attributes.
* Parses and validates `.agent-room/guardrails.json` schema.

### 4. `metrics [target-dir]`
Aggregates all JSON and Markdown session logs inside `.agent-room/sessions/` and renders a clean CLI dashboard detailing outcome success rates, task type distributions, and overall file edit volumes.

### 5. `pr-desc [target-dir]`
Parses the latest session log inside `.agent-room/sessions/` (based on timestamp filename order) and formats it into a Pull Request description template.
* Use `--write` (or `-w`) to output and save it directly to `.agent-room/pr-description.md`.

---

## Options

| Flag | Effect |
| --- | --- |
| `--name <name>` | Project name substituted into templates (default: target dir name) |
| `--tools <list>` | Comma-separated: `claude,cursor,windsurf,cline,codex,git,none` (default: prompt) |
| `--template-source <path>` | Custom templates folder path (default: searches local, home, package) |
| `--package-manager <name>` | Package manager to use, e.g. npm, poetry, cargo (default: npm) |
| `--language <name>` | Target project language, e.g. typescript, python, rust (default: javascript) |
| `--branch <name>` | Default git branch (default: main) |
| `--skill-packs <list>` | Comma-separated built-in names (`testing`, `security`, `release`, `code-review`, `api-design`, `database`, `performance`, `observability`, `documentation`), Git URLs (`git+ssh://...`), or local directory paths |
| `--org <name>` | Organization layer directory name to look for during template inheritance overlays |
| `--git` | Run `git init` and create an initial commit in the target directory |
| `--force` | Overwrite existing files instead of skipping them |
| `--write, -w` | Save generated PR description output to `.agent-room/pr-description.md` |
| `--verbose` | Print detailed stack traces on failure |
| `-y, --yes` | Skip all prompts, use defaults |

---

## Template Composition & Inheritance

`create-agent-room` supports a powerful hierarchical layering mechanism. The overlay resolver will find and inherit files, merging folders in order from lowest-priority to highest-priority:

1. **Packaged Default Templates** (built-in base rules)
2. **Packaged Stack-specific Templates** (e.g. `templates/stacks/python/`)
3. **Global Templates** (`~/.agent-room-templates/base/`)
4. **Global Stack-specific Templates** (`~/.agent-room-templates/stacks/python/`)
5. **Global Org-specific Templates** (`~/.agent-room-templates/org/<org-name>/`)
6. **Local Templates** (`.agent-room-templates/` or `--template-source`)

During this overlay process, files in higher-priority folders will overwrite conflicts from lower layers, enabling modular organization-wide guidelines with project-level overrides.
