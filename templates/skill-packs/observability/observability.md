---
name: observability
description: "Use when adding logging, metrics, tracing, alerting, or error handling to applications — or when deciding what to observe and how."
---

# Observability

## Overview

Observability is not "add console.log everywhere." It's a disciplined
approach to making systems understandable in production — where you can't
attach a debugger, set breakpoints, or reproduce bugs on demand. Good
observability answers: "What happened, where, when, and why?" from the
logs and metrics alone, without needing to read the source code.

## The iron law

```
EVERY PRODUCTION ERROR MUST BE TRACEABLE TO A ROOT CAUSE WITHOUT READING SOURCE CODE
```

If an error fires in production and the on-call engineer needs to read
the codebase to understand what went wrong, the observability is
insufficient. The log entry, metric, or trace should contain enough
context to diagnose the issue.

## The three pillars

### 1. Logs — what happened

Use structured logging (JSON), not unstructured strings.

```
BAD:  console.log("User login failed")
GOOD: logger.warn({ event: "auth.login_failed", userId: "u_123",
        reason: "invalid_password", ip: req.ip, requestId: req.id })
```

**What to log:**
- Business events: user signup, order placed, payment processed.
- Errors with full context: what was attempted, what failed, what input
  caused it.
- Security events: failed login attempts, permission denials, token
  expirations.

**What NOT to log:**
- Secrets, passwords, tokens, full credit card numbers. Ever.
- Success cases for high-frequency operations (every successful health
  check, every cache hit). Use metrics for these.
- Full request/response bodies in production (unless explicitly in a
  debug mode with PII scrubbing).

**Correlation IDs:** Generate a unique `requestId` at the entry point of
every request. Pass it through every function call, every service-to-
service call, and include it in every log entry. This lets you trace a
single user action across multiple services and log entries.

### 2. Metrics — how much

Metrics are aggregated numbers over time. Use them for trends, alerting,
and dashboards — not for debugging individual requests.

**The four golden signals (from Google SRE):**
- **Latency:** How long requests take. Track p50, p95, p99.
- **Traffic:** How many requests per second (or per minute).
- **Errors:** How many requests fail (as a rate, not a count).
- **Saturation:** How full are your resources (CPU, memory, disk, queue
  depth).

**Naming convention:** Use dot-separated namespaces.
```
api.users.request_duration_ms
api.users.error_count
db.connections.active
queue.orders.depth
```

### 3. Traces — where it went

Distributed traces show the path of a request across services. Use them
when a single user action touches multiple services and you need to find
which one is slow or failing.

- Instrument service boundaries (HTTP calls, queue publishes, database
  queries).
- Include trace IDs in log entries so you can correlate logs with traces.
- Don't trace everything in production — sample at 1-10% for normal
  traffic, 100% for errors.

## Error classification

Not all errors are equal. Classify them to determine the response:

| Category | Meaning | Response |
| --- | --- | --- |
| Transient | Temporary failure (network timeout, rate limit) | Retry with backoff |
| Permanent | Will never succeed (invalid input, missing resource) | Return error to caller, don't retry |
| Fatal | System cannot continue (out of memory, corrupt state) | Alert immediately, escalate |

**Anti-pattern:** Retrying permanent errors. If the input is invalid, it
will be invalid on the next attempt too. Check the error type before
retrying.

## Alert design

Alerts should be **actionable, not noisy.**

**Good alert:** "API error rate exceeded 5% for 5 consecutive minutes.
Dashboard: [link]. Runbook: [link]."

**Bad alert:** "Error occurred." (Which error? Where? What should I do?)

**Rules for alerts:**
- Every alert must have a runbook (even if it's one paragraph).
- Alert on symptoms (error rate, latency), not causes (CPU usage — unless
  it's at 95%+).
- Use severity levels: critical (wake someone up), warning (investigate
  during business hours), info (no action needed, for dashboards only).
- If an alert fires more than 3 times without action, it's noise — fix
  the underlying issue or tune the threshold.

## Red flags — stop and rethink

`console.log(error)` without context · logging PII or secrets ·
alerting on every single error instead of error rates · no correlation
IDs across services · metrics without dashboards (data collected but
never reviewed) · catch-and-swallow error handling (`catch (e) {}`) ·
"we'll add observability later."
