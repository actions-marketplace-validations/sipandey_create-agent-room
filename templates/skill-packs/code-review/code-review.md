---
name: code-review
description: "Use when reviewing pull requests, diffs, or code changes — whether as the reviewer or when preparing code for review."
---

# Code Review

## Overview

Code review is not proofreading — it's a systematic evaluation of whether
a change is correct, safe, maintainable, and appropriately scoped. An
agent reviewing code must follow a consistent priority order, not scan
for whatever catches its eye first.

## The iron law

```
REVIEW IN PRIORITY ORDER: SECURITY → CORRECTNESS → PERFORMANCE → STYLE
```

Security bugs that slip through review cause incidents. Correctness bugs
cause regressions. Performance issues cause gradual degradation. Style
issues cause friction. Review in order of impact.

## The review process

### 1. Understand the intent first

Before reading a single line of code:
- Read the PR description, linked issue, or design doc.
- Understand what the change is *supposed* to do.
- If the intent is unclear, ask before reviewing the implementation.

### 2. Review in priority order

**Security (blocking):**
- Does user input flow into queries, commands, or markup unsanitized?
- Are secrets hardcoded or logged?
- Are authorization checks present at the data layer, not just the route?
- Does the change introduce new attack surface (new endpoints, new file
  uploads, new auth flows)?

**Correctness (blocking):**
- Does the code actually implement the stated intent?
- Are edge cases handled (empty input, null, boundary values, concurrency)?
- Are error paths handled (what happens when the network call fails, the
  file doesn't exist, the database is down)?
- Does it have tests? Do the tests cover the meaningful behaviors?

**Performance (blocking if severe, otherwise non-blocking):**
- N+1 queries in loops?
- Unbounded data fetches (no pagination, no LIMIT)?
- Large allocations in hot paths?
- Missing indexes for new query patterns?

**Style and maintainability (non-blocking):**
- Naming clarity (would a new team member understand the intent?).
- Duplication that could be extracted.
- Comments that explain "why" not "what."

### 3. Check scope

A PR should do one thing. Red flags for scope creep:
- The PR title says "fix login bug" but also refactors the auth module.
- More than 500 lines changed for what should be a small fix.
- Unrelated formatting changes mixed with functional changes.

If scope is too broad, ask the author to split the PR. Don't review a
kitchen-sink PR — it's impossible to verify correctness when 5 concerns
are interleaved.

## Writing review comments

### Good comments are actionable

```
BAD:  "This could be better."
GOOD: "This query fetches all users without pagination. With 100K users
       this will OOM the server. Add LIMIT/OFFSET or cursor pagination."
```

### Distinguish blocking from non-blocking

- **Blocking:** Must be fixed before merge. Security issues, correctness
  bugs, missing tests for new behavior.
- **Non-blocking (nit):** Prefix with "nit:" — style suggestions, minor
  naming improvements, optional refactors. These should not block merge.

### Explain the "why," not just the "what"

```
BAD:  "Use a Map instead of an Object."
GOOD: "nit: Consider a Map here — the keys are user-provided strings,
       and Object prototype pollution is a risk if keys like '__proto__'
       are possible. Not blocking if input is validated upstream."
```

## Self-review before requesting review

Before submitting code for review, run your own checklist:

- [ ] Does every new function/endpoint have tests?
- [ ] Did I remove all debugging artifacts (`console.log`, `debugger`)?
- [ ] Are there any TODOs that should be resolved before merge?
- [ ] Is the diff minimal? (No unrelated formatting, no leftover experiments.)
- [ ] Does the PR description explain what changed and why?

## Red flags — request changes immediately

Hardcoded credentials · missing auth checks on new endpoints · raw SQL
with string interpolation · `eval()` or `Function()` with external input ·
tests that assert the implementation rather than the behavior ·
catch-and-swallow error handling · PRs with no tests for new behavior.
