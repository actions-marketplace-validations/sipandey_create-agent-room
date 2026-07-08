---
name: documentation
description: "Use when writing inline comments, doc comments, READMEs, API documentation, architecture decision records, or operational runbooks."
---

# Documentation

## Overview

Documentation is not an afterthought — it's a deliverable. Code without
documentation is code that the next person (human or agent) will
misunderstand, misuse, or rewrite from scratch. But bad documentation is
worse than no documentation — it creates false confidence.

## The iron law

```
DOCUMENT THE WHY, NOT THE WHAT
```

Code shows *what* happens. Documentation explains *why* it happens that
way, *what alternatives were rejected*, and *what assumptions hold.* If
the documentation just restates the code, it adds maintenance burden
without value.

## When to document what

### Inline comments

Use for non-obvious logic — the "why" behind a decision.

```
BAD:  // increment counter
      counter++;

GOOD: // Rate limiter uses a sliding window. We increment here rather than
      // in the middleware because failed auth attempts should count against
      // the limit even if the request is rejected before reaching the handler.
      counter++;
```

**Don't comment obvious code.** If the code is so unclear that it needs a
comment explaining *what* it does, refactor the code to be clearer instead.

### Doc comments (JSDoc, typedoc, docstrings)

Use for every public function, class, and module that other code consumes.

```javascript
/**
 * Resolves a user's effective permissions by merging role-based
 * permissions with any user-specific overrides.
 *
 * @param {string} userId - The user ID to resolve permissions for.
 * @param {string} resourceId - The resource being accessed.
 * @returns {Permission[]} Merged permissions, with user overrides
 *   taking precedence over role defaults.
 * @throws {NotFoundError} If the user does not exist.
 */
```

Include:
- What the function does (one sentence).
- Parameter descriptions with types.
- Return value description.
- Exceptions/errors thrown and when.
- Any side effects (writes to database, sends email, modifies global
  state).

### README sections

Every project's README should contain at minimum:
1. **What it is** — one paragraph explaining the project's purpose.
2. **Quick start** — how to install, configure, and run.
3. **Development setup** — how to set up a local development environment.
4. **Testing** — how to run the test suite.
5. **Architecture overview** — high-level description of the system
   structure (link to a diagram if complex).

### Architecture Decision Records (ADRs)

Use for significant architecture or design decisions that someone could
reasonably ask "why did you do it this way?"

**Format** (stored in `docs/decisions/` or `.agent-room/decisions.md`):

```markdown
### YYYY-MM-DD — Short title

**Status:** Accepted / Superseded by [link] / Deprecated

**Context:** What situation or problem prompted this decision?

**Decision:** What was decided and how?

**Consequences:** What are the trade-offs? What becomes easier? What
becomes harder?

**Alternatives considered:**
- Option A: description. Rejected because...
- Option B: description. Rejected because...
```

### Operational runbooks

For any system that runs in production, document the operational
procedures:

```markdown
## Runbook: [Service/Component Name]

### Health check
- URL: `GET /health`
- Expected: 200 with `{"status": "ok"}`
- If failing: Check database connectivity, then check [dependency].

### Common failure modes
1. **High memory usage:** Usually caused by [X]. Fix: [Y].
2. **Slow response times:** Check [Z] dashboard. If [metric] > [threshold],
   scale horizontally.

### Deployment
- Deploy via: `[command]`
- Rollback via: `[command]`
- Post-deploy verification: `[check]`
```

## API documentation

For services that expose APIs:

- Use OpenAPI/Swagger for REST APIs. Keep the spec in sync with the code
  (generate from annotations, or validate the spec in CI).
- Document every endpoint, every parameter, every response shape, every
  error code.
- Include example requests and responses for each endpoint.
- Document authentication requirements and rate limits.

## Documentation anti-patterns

| Anti-pattern | Problem | Fix |
| --- | --- | --- |
| "Self-documenting code" as an excuse | Not all "why" is visible in code | Write the comments the code can't express |
| Documentation in a wiki nobody reads | Out of sync within weeks | Keep docs next to the code they describe |
| Stale README | Worse than no README — misleads people | Update README as part of the PR that changes behavior |
| TODO comments without owners or dates | They accumulate forever | Format: `TODO(username, YYYY-MM-DD): description` |
| Generated docs with no curation | Noise overwhelms signal | Write summaries, examples, and guides on top of generated reference |

## Red flags — stop and document

A new team member asks "how does X work?" and nobody can point to a
document · a production incident requires reading source code to diagnose ·
a function has 8 parameters and no doc comment · the README's "quick start"
doesn't work · an ADR is missing for a decision that took the team a week
to make.
