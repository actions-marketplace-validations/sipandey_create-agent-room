# CLAUDE.md — create-agent-room

This file is read automatically by Claude Code. The actual guidance lives in
[`AGENTS.md`](AGENTS.md) and [`.agent-room/`](.agent-room/) — read those
first, this file only adds Claude Code-specific mechanics.

## Skills

The skills in `.agent-room/skills/` are mirrored into `.claude/skills/` so
Claude Code can discover and invoke them (`/brainstorming`,
`/writing-plans`, `/test-driven-development`, `/systematic-debugging`,
`/verification-before-completion`, `/closing-the-loop`).

`.agent-room/skills/` is the source of truth. If you edit a skill, re-run
`npx create-agent-room sync` to refresh the `.claude/skills/` copies — don't
edit the `.claude/skills/` copies directly, they'll be overwritten.

## Closing-the-loop hook

A `Stop` hook is wired up in `.claude/settings.json`, running
`.agent-room/hooks/close-the-loop-check.js` at the end of every turn. If the
turn changed tracked files outside the agent-room scaffold but didn't touch
`.agent-room/anti-patterns.md` or `.agent-room/decisions.md`, the hook
blocks the turn from ending and explains why. This is mechanical
enforcement of `.agent-room/skills/closing-the-loop.md` — it can't judge
whether an entry is *good*, only that the check wasn't silently skipped.

The exit hatch is a one-line waiver in `decisions.md`:
`<!-- no-log: routine change, no decision or anti-pattern worth recording -->`

The hook only looks at `git status --porcelain`, so unrelated pre-existing
dirty files in the work tree will also trigger it — commit or stash them
first if that gets noisy.

## Git rules

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

## Release process

The version lives in exactly one place: `version` in `package.json`. To
cut a release: bump it (semver), then run `npm install` immediately to
re-sync `package-lock.json` (this has drifted out of sync before when that
step was skipped), run `npm run lint && npm test`, write
`RELEASE_NOTES_vX.Y.Z.md` following the existing files' format, update
`README.md`/`CAPABILITIES.md` if behavior changed, commit, and tag
(`git tag vX.Y.Z`, matching `v1.2.1`, `v1.3.0`). See "Release process" in
[`AGENTS.md`](AGENTS.md) for the full checklist.

**Never run `npm publish`, `git push`, or `git push --tags`** — prepare
the release locally and hand off to a human for that step.
