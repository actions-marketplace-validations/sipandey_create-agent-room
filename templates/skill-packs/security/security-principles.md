---
name: security-principles
description: "Use when dealing with database operations, authentication, user input parsing, or secrets management."
---

# Security Principles

## Overview
Secure coding is not an afterthought. Agents must write secure code by default.

## The Threat Model
1. **Injection Attacks**: Always use parameterized queries or ORMs. Never construct raw queries containing concatenated string parameters.
2. **Secret Exposure**: Never check in API keys, passwords, or credentials. Use environment variables and add files with secrets to `.gitignore`.
3. **Improper Access Control**: Always validate the user session/claims on the server side for every request, not just in the UI.
4. **Input Sanitization**: Treat all client data as untrusted. Parse and validate schemas explicitly.
