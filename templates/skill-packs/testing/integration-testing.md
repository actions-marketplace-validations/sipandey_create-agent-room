---
name: integration-testing
description: "Use when implementing integration, API, or database-driven tests."
---

# Integration Testing

## Overview
Integration tests verify that components work together correctly. Unlike unit tests, they cross boundaries (e.g., HTTP requests, database transactions).

## Core Principles
1. **Isolated State**: Each test runs in isolation. Ensure databases are cleaned or rolled back after every test run.
2. **Real over Mocks**: Use actual databases (e.g., Docker containers or memory databases) and services where possible. Mock third-party APIs using deterministic mock servers.
3. **No Flakiness**: Avoid timing-dependent tests. Use retry mechanisms, wait-for-conditions, or event listeners instead of arbitrary sleeps.

## Commands
* Run integration tests: `{{TEST_COMMAND}}`
