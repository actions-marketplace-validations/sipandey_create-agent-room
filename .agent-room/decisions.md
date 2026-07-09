# Decisions Log — create-agent-room

Short, append-only record of architecture/design decisions and why. A
decision belongs here if a future session (or a future you) would otherwise
have to re-derive it from scratch by reading git history.

## Format

```
### YYYY-MM-DD — short title

**Decision:** what was decided.
**Why:** the constraint or trade-off that drove it.
**Rejected:** what else was considered, and why it lost.
```

<!-- Entries go below this line, newest first. -->

### 2026-07-09 — regression-test the npm package contents, and centralize release steps

**Decision:** added `test/package.test.js`, which runs `npm pack --dry-run
--json` and asserts this repo's own dogfooded `.agent-room/`, `.claude/`,
`.github/`, `AGENTS.md`, and `CLAUDE.md` never appear in the published
tarball, while `templates/.agent-room/*` (the real scaffold source) and
`examples/*/AGENTS.md` still do. Also added a "Release process" section to
`AGENTS.md`/`CLAUDE.md` documenting the version-bump → `npm install` →
lint/test → release notes → commit → tag sequence, and stating explicitly
that `npm publish`/`git push`/`git push --tags` require a human.
**Why:** the `files` field in `package.json` already excludes the root
scaffold today (it's a whitelist and those paths aren't in it), but that
protection was implicit — nothing would fail if a future change to
`files` accidentally widened it. Release steps were similarly undocumented
and had already drifted once (`package-lock.json` was stale relative to
`package.json` until an audit caught it).
**Rejected:** an `.npmignore` file — redundant since `files` already takes
precedence over it, and would only add a second place to keep in sync.
