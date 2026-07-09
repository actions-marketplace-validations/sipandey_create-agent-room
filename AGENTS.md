# Agent Instructions — create-agent-room

This file is the entry point for any AI coding agent (Claude Code, Codex,
Cursor, etc.) working in this repository. Tool-specific files (`CLAUDE.md`,
`.cursor/rules`, ...) are thin pointers back to this file plus their own
loading mechanics — the actual content lives here and in `.agent-room/`.

## The First 5 Minutes

When you first enter this repository or start a new task, **stop and read**.
Do not immediately start writing code.

1.  **Check coordination state:** Are there other agents working? Check open
    PRs, issue assignments, or the `.agent-room/sessions/` directory.
    Read `.agent-room/coordination/handoff-protocol.md` if you are picking
    up someone else's work.
2.  **Classify the work:** Use `.agent-room/workflow-classifier.md`. Don't
    apply Feature-weight process to a one-line bug fix, and don't skip design
    for a "simple" feature.
3.  **Check guardrails:** Review `.agent-room/guardrails.md`. Ensure your
    planned work does not touch protected paths or require human approval
    without asking first.
4.  **Review past decisions:** Read `.agent-room/anti-patterns.md` and
    `.agent-room/decisions.md` to understand *why* the codebase is structured
    this way, and what mistakes to avoid.

## Read these before doing anything non-trivial

- [`.agent-room/principles.md`](.agent-room/principles.md) — how to get
  reliable output from an LLM (context, iteration, checkpointing, tests as
  spec, negative knowledge).
- [`.agent-room/guardrails.md`](.agent-room/guardrails.md) — boundaries and
  constraints. Check before touching protected paths or making large changes.
- [`.agent-room/workflow-classifier.md`](.agent-room/workflow-classifier.md) —
  how to size the process to the work (Bug / Enhancement / Feature / Product).
- [`.agent-room/anti-patterns.md`](.agent-room/anti-patterns.md) — things that
  have already gone wrong in this project. Check before repeating a mistake;
  append after fixing one.
- [`.agent-room/decisions.md`](.agent-room/decisions.md) — short log of
  architecture/design decisions and why. Append when you make one that future
  sessions would otherwise have to re-derive.
- [`.agent-room/skills/`](.agent-room/skills/) — procedures to follow, not
  just read: `brainstorming`, `writing-plans`, `test-driven-development`,
  `systematic-debugging`, `verification-before-completion`,
  `closing-the-loop`.
- [`.agent-room/coordination/`](.agent-room/coordination/) — protocols for
  multi-agent workflows: `handoff-protocol`, `scope-boundaries`,
  `session-log-format`.

## The default workflow

1. **Classify the work** using `.agent-room/workflow-classifier.md`.
2. **For anything beyond a trivial bug fix**, brainstorm before building: ask
   clarifying questions, propose 2-3 approaches with trade-offs, get the
   design approved, *then* write a short design note under `docs/plans/`.
3. **Use TDD**: write the failing test first, watch it fail, write the
   minimal code to pass, refactor, commit. No production code without a
   failing test first.
4. **Debug systematically**: find the root cause before proposing a fix.
   Reproduce, check recent changes, gather evidence at component boundaries.
   No fixes without root-cause investigation.
5. **Verify before claiming done**: run the actual test/build/lint command in
   this turn and read its output before saying "tests pass" or "fixed."
   "Should work" is not evidence.
6. **Serialize state**: Before ending your session, log your work in
   `.agent-room/sessions/` according to `session-log-format.md`, and write
   a handoff note if the task is incomplete.
7. **Close the loop — before ending the turn, not after**: this is a gate,
   not a suggestion. Follow `.agent-room/skills/closing-the-loop.md`. If the
   turn fixed a bug, found a root cause, or made a non-obvious design call,
   append it to `.agent-room/anti-patterns.md` or `.agent-room/decisions.md`
   *before* claiming the task is done. If nothing qualifies, say so
   explicitly rather than silently skipping the check.

## Project-specific notes

- **Language:** javascript
- **Package Manager:** npm
- **Default Branch:** main

Commands:
- Run tests: `npm test`
- Run linting: `npm run lint`

### Git identity & rules

Use this identity for commits in this repo:

```
git config user.name "Siddharth Pandey"
git config user.email "siddharth.pandey06@gmail.com"
```

Re-verify (`git config user.name && git config user.email`) before any
push, not just at session start — a global config change or a fresh clone
mid-session can silently reset it.

- Do not run `git push` unless explicitly asked.
- Do not amend or rewrite history on shared branches without being asked.

### Release process

This package is published to npm as `create-agent-room`
(https://www.npmjs.com/package/create-agent-room). The version lives in
exactly one place: the `version` field in `package.json`. To cut a release:

1. **Pick the version bump** (semver): patch for fixes, minor for
   backward-compatible additions (new flags, templates, skill packs),
   major for breaking changes to the CLI, flags, or scaffolded output.
2. **Edit `version` in `package.json`.**
3. **Run `npm install`** right after, even though nothing else changed —
   this re-syncs `package-lock.json`'s `version` fields to match. Skipping
   this step is how `package-lock.json` drifted out of sync with
   `package.json` in the past (caught during an audit, not before a
   release).
4. **Run the full check before writing anything else:** `npm run lint &&
   npm test` must pass clean.
5. **Write `RELEASE_NOTES_vX.Y.Z.md`** at the repo root. Follow the
   existing files' shape — `## Highlights` (what changed and why it
   matters), `## Fixes`, `## Docs`, `## Housekeeping` as applicable. See
   `RELEASE_NOTES_v1.3.0.md` for a recent example.
6. **Update `README.md`** (and `CAPABILITIES.md` if enforcement behavior
   changed) if commands, flags, or capabilities changed.
7. **Commit** the version bump, lockfile, release notes, and any doc
   updates. Past releases did this either as part of the feature commit
   that earns the bump, or as a dedicated `chore: release vX.Y.Z` /
   `docs: add vX.Y.Z release notes` commit — either is fine, just don't
   silently fold a version bump into an unrelated commit's message.
8. **Tag the release commit:** `git tag vX.Y.Z` (matches existing tags:
   `v1.2.1`, `v1.3.0`).

**Do not run `npm publish`, `git push`, or `git push --tags` yourself.**
Publishing and pushing a tag are irreversible and externally visible —
prepare everything above locally, then stop and hand off to a human to
review the diff and push/publish.

<!-- Add stack, conventions, and anything else an agent needs that isn't derivable. -->
