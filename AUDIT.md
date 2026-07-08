# Create-Agent-Room: Independent Audit Report

**Date:** 2026-07-08  
**Scope:** Gap analysis between stated features and implementation  
**Assessment:** Feature-complete for scaffolding, but lacks enforcement and runtime integration

---

## Executive Summary

`create-agent-room` successfully scaffolds a governance framework for LLM agents but operates primarily as a **documentation generator and project initializer**. Most enforcement, orchestration, and runtime features exist as documented guidelines rather than executable mechanisms.

**Key Finding:** The tool is a _prescriptive template engine_, not a _prescriptive enforcement system_.

---

## Detailed Findings

### 1. **Multi-Agent Coordination** — Documented but Not Implemented ⚠️

**Intent:** "Scaffolds guidelines for handoffs, scope boundaries, and structured session logs."

**Reality:**

- ✅ Templates define handoff-protocol.md, session-log-format.md, scope-boundaries.md
- ✅ Metrics command aggregates session logs post-hoc
- ✅ PR description generator extracts handoff notes from logs
- ❌ **No real-time coordination mechanism:** Agents can't query handoff state during execution
- ❌ **No state serialization helpers:** Agents manually write session logs; no structured handoff API
- ❌ **No session state validation:** No command checks if a handoff note contains required fields (Completed, In Progress, Blocked On, Assumptions)
- ❌ **No session orchestration:** Can't queue, schedule, or route work between agents

**Gap:** Handoff protocol exists as prose guidance only. No executable interfaces for agent-to-agent communication.

---

### 2. **Agent Guardrails** — Schema Validation Only ⚠️

**Intent:** "Defines protected paths, require-approval rules, and forbidden actions via `guardrails.json`."

**Reality:**

- ✅ `validate` command checks guardrails.json JSON schema
- ✅ Template creates guardrails.md (prose constraints) and guardrails.json (machine-readable)
- ❌ **No enforcement layer:** guardrails.json is never read or enforced during any operation
- ❌ **No protected path enforcement:** Agents can write to any file despite protectedPaths list
- ❌ **No approval gate:** No mechanism to require human approval before writing to protected areas
- ❌ **No forbidden action prevention:** forbiddenActions list is never checked against actual operations

**Gap:** Guardrails are validated for structural correctness but never enforced. They're decorative.

**Impact:** An agent can ignore guardrails entirely. The tool provides no runtime constraint mechanism.

---

### 3. **Session Log Format Enforcement** — Missing Entirely ❌

**Intent:** Template defines structured session-log-format.md with required sections: Date, Agent, Classification, Goal, Files touched, Actions taken, Tests run, Decisions, Outcome.

**Reality:**

- ✅ Session log format is documented in template
- ✅ Metrics command attempts to parse logs (loose parsing via regex)
- ✅ PR description generator extracts data from logs
- ❌ **No validation command:** No way to lint session logs against the format
- ❌ **No schema definition:** Session log format is prose-only; no JSON schema
- ❌ **No enforcement:** Agents can submit logs with missing sections and metrics won't error
- ❌ **No linting in CI:** No CI validation that session logs follow the template

**Gap:** Session logs can be malformed. The tool silently degrades when parsing incomplete logs.

**Test Case:** A log missing `## Actions taken` section will partially parse, with `actions` field becoming empty string.

---

### 4. **Inheritance & Composition** — Partially Implemented ⚠️

**Intent:** "Composes templates sequentially from base structures, stack-specific files (e.g. Python, React), org-specific conventions, and project overrides."

**Stated 6-layer hierarchy:**

1. Packaged Default Templates (built-in base rules)
2. Packaged Stack-specific Templates (e.g. `templates/stacks/python/`)
3. Global Templates (`~/.agent-room-templates/base/`)
4. Global Stack-specific Templates (`~/.agent-room-templates/stacks/python/`)
5. Global Org-specific Templates (`~/.agent-room-templates/org/<org-name>/`)
6. Local Templates (`.agent-room-templates/` or `--template-source`)

**Reality:**

- ✅ Code implements 6-layer resolver in `fsutil.js:getLayers()` and `resolveTemplateSources()`
- ✅ `copyFileInherited()` searches layers and composes files
- ❌ **No packaged stack templates:** `templates/stacks/` directory doesn't exist in the package
- ❌ **Mismatch in documentation:** README claims Python/React stacks but they're not present
- ❌ **Limited testing:** Only adapter-level composition is tested; stack composition not verified
- ⚠️ **Implicit behavior:** Users expect `--language python` to pull Python-specific rules, but only language detection works; explicit stack composition is undocumented

**Gap:** Layer system is implemented but the primary use case (stack-specific inheritance) lacks packaged templates. Documentation oversells the feature.

**Path forward:** Need `templates/stacks/python/`, `templates/stacks/typescript/`, `templates/stacks/react/`, etc.

---

### 5. **Tool Adapters** — Incomplete Coverage ⚠️

**Claimed:** "optional thin adapters for Claude Code, Cursor, Windsurf, Cline, and Git"

**Reality:**

- ✅ CLAUDE.md.tmpl → `.claude/` or `CLAUDE.md`
- ✅ cursorrules.tmpl → `.cursorrules`
- ✅ windsurfrules.tmpl → `.windsurfrules`
- ✅ clinerules.tmpl → `.clinerules`
- ❌ **Codex adapter missing:** VALID_TOOLS includes `'codex'` but no template exists
- ✅ Git adapter (pre-commit hook)
- ⚠️ **Claude-specific hooks only:** Only Claude gets a close-the-loop-check hook; others don't
- ❌ **No Cursor/Windsurf hooks:** Cursor and Windsurf get rules files but no automated governance hooks

**Gap:** Asymmetric tool support. Codex is listed but not implemented. Only Claude has executable governance (close-the-loop hook).

---

### 6. **Skill Pack System** — 9 Built-in Packs, But Minimal Content ⚠️

**Documented 9 skill packs:** testing, security, database-migrations, api-design, code-review, performance, observability, documentation, release

**Reality:**

- ✅ All 9 directories exist under `templates/skill-packs/`
- ❌ **Minimal content:** Most packs contain only 1-2 files (e.g., `api-design/api-design.md`)
- ❌ **No enforcement:** Skill pack content is guidance, not executable rules
- ✅ External skill packs work (git clone and local paths)
- ❌ **No skill validation:** No way to verify a skill pack is complete or well-formed

**Examples:**

- `api-design/api-design.md` — 1 file, ~100 lines
- `code-review/code-review.md` — 1 file, ~80 lines
- `testing/integration-testing.md` — 1 file

**Gap:** Skill packs are templates for documentation, not integrated practices. No hooks, no tooling, no validation.

---

### 7. **CI Room Validation** — Partial Implementation ⚠️

**Intent:** "Lint skill YAML frontmatter headers and verify guardrail schemas in your CI/CD pipelines."

**Reality:**

- ✅ `validate` command checks skill file frontmatter (name, description)
- ✅ `validate` lints guardrails.json schema
- ✅ Validate returns exit code 1 on error (CI-friendly)
- ❌ **No guardrails validation of content:** Only structure is checked (protectedPaths, requireApprovalFor, forbiddenActions exist and are arrays)
- ❌ **No session log validation:** No CI step to verify session logs are well-formed
- ❌ **No AGENTS.md validation:** No checks that AGENTS.md links to correct files
- ❌ **Incomplete file checks:** Validate checks for file existence but not content quality

**Gap:** Validation is structural only. A guardrails.json with empty arrays passes validation.

---

### 8. **Observability Metrics Dashboard** — Partial Metrics ⚠️

**Claimed Metrics:** "success rates, classifications, file modifications volumes"

**Reality:**

- ✅ Parses session logs and extracts:
  - Session count
  - Success/Handed-Off/Incomplete outcome distribution
  - Classification distribution (Bug, Feature, Enhancement, Product)
  - File modification counts (read, created, modified)
  - Agent distribution
- ❌ **No time-series data:** Metrics are aggregates, not trends
- ❌ **No performance metrics:** No tracking of time-to-completion, cost, or token usage
- ❌ **No filtering:** Can't filter metrics by agent, date range, or classification
- ❌ **No alerting:** No thresholds or alerts (e.g., "High failure rate")
- ❌ **No export:** Metrics are CLI output only; no JSON, CSV, or API export

**Gap:** Metrics are read-only aggregates. No dashboarding, trending, or alerting.

---

### 9. **PR Description Generator** — Works But Limited ✅

**Reality:**

- ✅ Parses latest session log
- ✅ Extracts Goal, Files Touched, Actions, Tests, Decisions, Outcome
- ✅ Generates structured PR description
- ✅ Can write to `.agent-room/pr-description.md`
- ✅ Works with both Markdown and JSON session logs
- ⚠️ **Fragile parsing:** Regex-based extraction can fail on edge cases (e.g., "Handoff note" in a code block)
- ❌ **No PR integration:** Doesn't push to GitHub, GitLab, or create actual PRs

**Status:** Feature is solid for what it does. Mostly complete.

---

### 10. **Stack Auto-Detection** — Works Well ✅

**Reality:**

- ✅ Detects Python (Pipfile, requirements.txt, pyproject.toml)
- ✅ Detects JavaScript/TypeScript (package.json, tsconfig.json)
- ✅ Detects Rust (Cargo.toml)
- ✅ Detects Go (go.mod)
- ✅ Detects Java/Kotlin (pom.xml, build.gradle)
- ✅ Auto-detects package managers (npm, yarn, pnpm, bun, pip, pipenv, poetry, cargo, go, gradle, maven)
- ✅ Derives correct test and lint commands

**Status:** Feature is complete and well-tested.

---

### 11. **Template Variable System** — Works ✅

**Reality:**

- ✅ Variable substitution implemented ({{PROJECT_NAME}}, {{LANGUAGE}}, {{PACKAGE_MANAGER}}, etc.)
- ✅ All adapters use variables correctly
- ✅ Comments in templates guide extensions

**Status:** Feature is complete.

---

### 12. **Sync Command** — Partially Functional ⚠️

**Claimed:** "Synchronize custom rules from `.agent-room/skills/` directly to `.claude/skills/` mirrors."

**Reality:**

- ✅ Reads skills from `.agent-room/skills/`
- ✅ Mirrors to `.claude/skills/`
- ✅ --check mode verifies without writing
- ✅ Detects uncommitted git changes and skips overwriting by default
- ❌ **Only works for Claude:** Code explicitly targets `.claude/` only
- ❌ **No Cursor/Windsurf sync:** Doesn't sync to `.cursor/` or `.windsurfrules`
- ❌ **One-way sync:** Doesn't detect if `.claude/` skills have manual edits that should feed back

**Gap:** Sync is Claude-only. Multi-tool sync not implemented.

---

### 13. **Testing Coverage** — Good for Init/Validate, Sparse for Features ⚠️

**Test Files:**

- `cli.test.js` — CLI argument parsing ✅
- `init.test.js` — Scaffolding ✅
- `validate.test.js` — Validation ✅
- `fsutil.test.js` — File utilities ✅
- `pr.test.js` — PR description generation ✅
- `metrics.test.js` — Metrics ⚠️ (basic tests, doesn't test all metrics types)
- `sync.test.js` — Sync ⚠️ (limited coverage)

**Coverage Gaps:**

- ❌ No tests for guardrails enforcement (because it doesn't exist)
- ❌ No tests for session log format validation (because it doesn't exist)
- ❌ No tests for multi-layer template inheritance
- ❌ No tests for external skill pack cloning
- ❌ No tests for agent auto-detection edge cases

---

### 14. **Documentation vs Reality** — Mismatches 📋

| Claimed Feature                   | Status                        | Reality                                           |
| --------------------------------- | ----------------------------- | ------------------------------------------------- |
| "Multi-Agent Coordination"        | ⚠️ Partial                    | Only templates and post-hoc metrics               |
| "Agent Guardrails"                | ❌ Not enforced               | JSON schema validated, but never used             |
| "Inheritance & Composition"       | ⚠️ Implemented but incomplete | 6-layer system works, but stack templates missing |
| "Built-in & External Skill Packs" | ✅ Works                      | External works, built-in exist but minimal        |
| "CI Room Validation"              | ⚠️ Partial                    | Structural validation only                        |
| "Observability Metrics Dashboard" | ⚠️ Partial                    | Basic aggregates, no trending/alerts              |
| "PR Description Generator"        | ✅ Works                      | Solid feature                                     |
| "Optional thin adapters"          | ⚠️ Incomplete                 | Codex missing, Claude-only hooks                  |

---

## Missing Features That Could Be Added

### High Priority (Align intent with implementation)

1. **Session Log Validation Command**
   - Add `create-agent-room lint-sessions [target-dir]`
   - Validate all logs in `.agent-room/sessions/` against schema
   - Check for required sections, non-empty values
   - Return exit code for CI

2. **Guardrails Enforcement**
   - Add pre-commit hook that reads guardrails.json
   - Block commits to protectedPaths without approval flag
   - Block commits with forbiddenActions patterns

3. **Stack-Specific Templates**
   - Create `templates/stacks/python/`, `templates/stacks/typescript/`, `templates/stacks/react/`
   - Include language-specific AGENTS.md, skills, principles
   - Document expected structure for stack inheritance

4. **Session State API**
   - Expose helpers for agents to query current session, handoff state
   - Provide structured session log writer (not free-form markdown)
   - Example: `createSessionLog({ goal, classification, files: { read, created, modified } })`

5. **Codex Adapter Template**
   - Implement `.codexrules` or equivalent for Codex (if still supported)

### Medium Priority (Enhance existing features)

6. **Multi-Tool Sync**
   - Extend sync to support `.cursorrules`, `.windsurfrules`
   - Sync in both directions with conflict detection

7. **Metrics Export**
   - Add `--format json|csv` to metrics command
   - Enable parsing by external dashboarding tools

8. **Session Log Trending**
   - Add `create-agent-room trends [target-dir] --days 30`
   - Show success rate over time, classification trends

9. **Skill Pack Validation**
   - Validate that skill packs contain expected files
   - Check for frontmatter in all skill pack .md files

10. **Hook Management**
    - Extend close-the-loop hook to all tool adapters (Cursor, Windsurf, Cline)
    - Auto-register hooks on init

### Lower Priority (Nice-to-have)

11. **PR Integration**
    - Auto-push PR descriptions to GitHub/GitLab API
    - Detect existing PRs and auto-update

12. **Approval Workflow**
    - Simple approval gate for guardrails violations
    - Slack/email notifications for pending approvals

13. **Agent Performance Tracking**
    - Track cost, token usage, latency per session
    - Correlate with success rates

---

## Architecture Observations

### Strengths

1. **Clean separation of concerns:** Each subcommand has its own module (init.js, validate.js, metrics.js, pr.js, sync.js)
2. **Good file system abstractions:** fsutil.js provides solid templating and inheritance logic
3. **Responsive CLI:** Fast feedback on operations
4. **Extensible template system:** Custom templates work well
5. **Solid core scaffolding:** The init and validate commands are battle-tested

### Weaknesses

1. **No runtime constraint system:** Guardrails live in JSON but no enforcement mechanism
2. **Parsing is fragile:** Session log parsing relies on regex; a malformed log silently degrades
3. **No state management:** Each command reads files independently; no session state cache
4. **Limited error recovery:** Errors in sync, metrics, or pr-desc often fail silently or produce incomplete output
5. **No locking:** Multiple agents could write session logs concurrently with race conditions
6. **No audit trail:** No log of what changed, when, or by whom (except git history)

---

## Recommendations

### For Immediate Impact

1. **Add session log validation** — This aligns with the "CI Room Validation" promise
2. **Document stack inheritance limitations** — Be honest about what's implemented vs. what's aspirational
3. **Implement guardrails enforcement** — At least for pre-commit hooks; even a basic mechanism would be valuable
4. **Add Codex adapter or remove from VALID_TOOLS**

### For Roadmap

1. **Session state API** — Enable real agent orchestration
2. **Multi-tool sync** — Extend Claude-only features to all adapters
3. **Metrics trending and export** — Make observability actionable

### For Documentation

1. Clarify which features are prescriptive (how-to) vs. prescriptive (enforced)
2. Call out what requires human discipline (e.g., following the workflow classifier)
3. Document the aspirational features clearly (e.g., stack inheritance is mostly a framework, not packaged)

---

## Conclusion

`create-agent-room` is a **well-engineered scaffolding tool** that creates a solid governance _framework_ for LLM agents. It excels at:

- ✅ Generating initial project structure
- ✅ Providing templates and guidance
- ✅ Post-hoc analytics (metrics, PR descriptions)

It falls short of its ambition as an **agent constraint and coordination system** because:

- ❌ Guardrails are documented, not enforced
- ❌ Multi-agent coordination is templates only
- ❌ Session logs are free-form, not validated
- ❌ Stack inheritance is partially implemented

**Recommended Position:** Position the tool as a _best-practices scaffolder and analytics engine_ rather than a _runtime enforcement platform_. Add enforcement features as distinct, opt-in subcommands (e.g., `create-agent-room enforce-guardrails`). This clarifies intent and makes the roadmap clearer.
