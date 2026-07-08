---
name: api-design
description: "Use when designing, implementing, or modifying REST APIs, GraphQL schemas, or any service interface that other systems or clients consume."
---

# API Design

## Overview

An API is a contract. Unlike internal code, changing an API breaks other
people's code. Design for clarity, consistency, and evolution from the
start — retrofitting these qualities is expensive and disruptive.

## The iron law

```
BREAKING CHANGES REQUIRE A VERSIONED MIGRATION PATH
```

Never remove, rename, or change the type of an existing field, endpoint,
or response shape without a deprecation period and a documented migration
path. "Nobody uses this endpoint" is not evidence — check access logs.

## Resource naming

- Use nouns, not verbs: `/users`, not `/getUsers`.
- Use plural nouns: `/orders`, not `/order`.
- Use kebab-case for multi-word resources: `/order-items`, not
  `/orderItems` or `/order_items`.
- Nest for relationships: `/users/{id}/orders`, not `/getUserOrders`.
- Keep nesting shallow (max 2 levels). Deep nesting creates rigid
  coupling: `/users/{id}/orders/{oid}/items/{iid}/comments` is a sign
  the resource model needs rethinking.

## HTTP verb semantics

| Verb | Meaning | Idempotent | Safe |
| --- | --- | --- | --- |
| GET | Retrieve a resource | Yes | Yes |
| POST | Create a new resource | No | No |
| PUT | Replace a resource entirely | Yes | No |
| PATCH | Partially update a resource | No* | No |
| DELETE | Remove a resource | Yes | No |

*PATCH is not inherently idempotent but can be designed to be.

**Common agent mistakes:**
- Using POST for everything (including fetches and updates).
- Using GET with a request body (not universally supported).
- Using DELETE to "soft delete" without documenting the behavior.

## Error response contract

Every API should return errors in a **consistent shape**. Don't invent a
new error format per endpoint.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email address is not valid.",
    "details": [
      {
        "field": "email",
        "reason": "Must be a valid email address.",
        "value": "not-an-email"
      }
    ]
  }
}
```

Rules:
- `code` is machine-readable (constant string, not a sentence).
- `message` is human-readable (for debugging, not for end users).
- `details` is optional, for validation errors with multiple fields.
- HTTP status code matches the error type (see table below).

| Status | When to use |
| --- | --- |
| 400 | Client sent invalid data (validation, malformed JSON) |
| 401 | No valid authentication credentials |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource does not exist |
| 409 | Conflict (duplicate email, version mismatch) |
| 422 | Request is syntactically valid but semantically wrong |
| 429 | Rate limit exceeded |
| 500 | Server error (never expose internal details to the client) |

## Pagination

Never return unbounded lists. Every list endpoint must support pagination.

**Cursor-based (recommended for large datasets):**
```
GET /orders?cursor=eyJpZCI6MTIzfQ&limit=20
```
Returns a `nextCursor` in the response. Stable under insertions/deletions.

**Offset-based (simpler, less stable):**
```
GET /orders?offset=40&limit=20
```
Breaks when items are inserted or deleted during pagination. Acceptable
for small, slowly-changing datasets.

**Always include pagination metadata in the response:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTQzfQ",
    "hasMore": true
  }
}
```

## Versioning

When a breaking change is unavoidable:

1. **URL versioning** (`/api/v2/users`) — simple, explicit, easy to route.
2. **Header versioning** (`Accept: application/vnd.api.v2+json`) — cleaner
   URLs but harder to test in a browser.

**Deprecation protocol:**
1. Add a `Sunset` header to the old endpoint with the removal date.
2. Log usage of deprecated endpoints (so you can notify consumers).
3. Maintain the old version for at least one release cycle (minimum 30
   days for internal APIs, 90 days for public APIs).
4. Document migration steps in the changelog.

## Breaking change detection

Before modifying an existing endpoint, check:

- [ ] Am I removing or renaming a field in the response? → Breaking.
- [ ] Am I changing a field's type (string → number)? → Breaking.
- [ ] Am I adding a new required field to the request? → Breaking.
- [ ] Am I changing the HTTP status code for an existing error? → Breaking.
- [ ] Am I changing the URL path or query parameter names? → Breaking.

If any answer is "yes," use the versioning and deprecation protocol above.
Adding new optional fields to responses or requests is generally safe.

## Red flags — stop and redesign

Endpoints that accept 20+ query parameters · response shapes that change
based on the caller's role (use separate endpoints instead) · error
responses that return HTML instead of JSON · list endpoints without
pagination · APIs that expose internal database IDs without obfuscation ·
PUT endpoints that silently ignore unknown fields.
