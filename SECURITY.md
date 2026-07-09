# Security Policy

## Supported Versions

Only the latest published release on npm receives security fixes. This
project has no long-term-support branch, so upgrading to the latest
version is the fix for any reported issue.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| older   | ❌        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security reports.**

Report privately via
[GitHub Security Advisories](https://github.com/sipandey/create-agent-room/security/advisories/new)
for this repository — private by default, and lets us coordinate a fix
and disclosure timeline with you directly.

Include the affected version, a minimal reproduction, and the impact
(e.g. "the guardrails pre-commit hook can be bypassed without setting
`GUARDRAILS_BYPASS`").

## What to Expect

- **Acknowledgment:** within 5 business days.
- **Triage:** severity confirmed within 10 business days of acknowledgment.
- **Fix & disclosure:** timeline depends on severity; you'll be credited
  in the release notes unless you'd rather stay anonymous.

Most realistic concerns involve the generated pre-commit hooks and
guardrails config, not the CLI itself — see `.agent-room/guardrails.md`
and `CAPABILITIES.md` for what's actually enforced today.
