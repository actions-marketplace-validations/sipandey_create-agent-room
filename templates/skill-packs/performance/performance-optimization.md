---
name: performance-optimization
description: "Use when investigating slow code, optimizing queries, reducing load times, or making architectural decisions that affect throughput and latency."
---

# Performance Optimization

## Overview

Performance optimization without measurement is superstition. The most
common performance mistake agents make is optimizing code that isn't slow
while ignoring code that is. Measure first, optimize the bottleneck,
measure again.

## The iron law

```
MEASURE BEFORE AND AFTER EVERY OPTIMIZATION
```

If you can't measure the improvement, you don't know if you improved
anything. Optimizations that aren't measured are guesses — and guesses
frequently make things worse by adding complexity without benefit.

## The optimization protocol

### Step 1: Define the metric

Before optimizing, define what "fast enough" means:
- **API latency:** p50, p95, p99 response times. p95 matters more than
  average — averages hide tail latency.
- **Page load:** Time to First Byte (TTFB), Largest Contentful Paint
  (LCP), Time to Interactive (TTI).
- **Throughput:** Requests per second the system can sustain.
- **Resource usage:** Memory, CPU, disk I/O under expected load.

### Step 2: Profile, don't guess

- Use profiling tools (flame graphs, query analyzers, Chrome DevTools
  Performance tab), not intuition.
- Find the actual bottleneck. Common surprise: "I thought the API was
  slow but the bottleneck was a DNS lookup, not the database query."
- Profile under realistic conditions (production-like data volumes, not
  10 rows in a test database).

### Step 3: Optimize the bottleneck

Fix the measured bottleneck. Don't optimize adjacent code "while you're
in there."

### Step 4: Measure again

Run the same benchmark. Compare results. If the improvement is
statistically insignificant, revert — the optimization added complexity
without value.

## Common performance problems and fixes

### N+1 queries

**The problem:** A loop fetches related data one row at a time.
```
users = db.query("SELECT * FROM users")
for user in users:
    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)
```
100 users = 101 queries. 10,000 users = 10,001 queries.

**The fix:** Eager load or batch fetch.
```
users = db.query("SELECT * FROM users")
user_ids = [u.id for u in users]
orders = db.query("SELECT * FROM orders WHERE user_id IN (?)", user_ids)
```
100 users = 2 queries. 10,000 users = 2 queries.

### Unbounded queries

**The problem:** A query fetches all rows without a LIMIT.
```
SELECT * FROM events  -- 50 million rows
```

**The fix:** Always paginate. Use LIMIT/OFFSET for small datasets,
cursor-based pagination for large ones. Every list query must have a
bound.

### Missing indexes

**The problem:** A WHERE clause or JOIN on an unindexed column causes a
full table scan.

**The fix:** Add an index on columns used in WHERE, JOIN, and ORDER BY
clauses. But don't add indexes speculatively — each index slows writes
and uses storage. Add when you have a measured slow query.

### Premature caching

**The problem:** Caching added before measuring whether the underlying
operation is actually slow. The cache adds invalidation complexity,
stale data risks, and memory pressure — for a query that takes 5ms.

**The fix:** Cache only when:
1. The operation is measurably slow (>100ms for user-facing, >1s for
   background).
2. The data changes infrequently relative to read frequency.
3. Staleness is acceptable for the use case.

When caching:
- Set explicit TTLs. Never cache without an expiration.
- Document the invalidation strategy. "Cache invalidation" is where most
  caching bugs live.
- Monitor hit rates. A cache with <80% hit rate is probably not worth the
  complexity.

### Frontend bundle bloat

**The problem:** A 2MB JavaScript bundle for a page that needs 200KB of
logic.

**The fix:**
- Audit with `webpack-bundle-analyzer`, `source-map-explorer`, or
  equivalent.
- Code-split by route. Users shouldn't download the admin dashboard code
  when viewing the login page.
- Lazy-load below-the-fold components.
- Replace heavy libraries with lighter alternatives when the full feature
  set isn't needed.

## Performance budgets

Set budgets and enforce them in CI:

| Metric | Budget | Enforcement |
| --- | --- | --- |
| API p95 latency | <200ms | Load test in CI, alert on regression |
| Bundle size | <250KB gzipped | Build step fails if exceeded |
| Database query count per request | <10 | Logging + review |
| LCP | <2.5s | Lighthouse CI |

Budgets prevent gradual degradation. Without them, performance erodes
one "small" addition at a time until the system is unusably slow.

## Red flags — stop and measure

"This should be faster" without data · optimizing code that profiling
shows isn't in the hot path · adding a cache for a 5ms operation ·
"premature optimization is the root of all evil" used to justify never
measuring · rewriting in a "faster language" before profiling the current
implementation.
