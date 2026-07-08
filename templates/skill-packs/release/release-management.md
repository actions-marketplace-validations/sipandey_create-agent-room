---
name: release-management
description: "Use when preparing release commits, tagging, bumping version numbers, or compiling changelogs."
---

# Release Management

## Overview
Releasing software should be automated, reproducible, and traceably documented.

## Release Process
1. **Version Bump**: Increment the version number in configuration files (e.g. `package.json`, `setup.py`) according to Semantic Versioning (SemVer).
2. **Changelog Generation**: Compile changes into a `CHANGELOG.md` file, grouped under features, bug fixes, performance, and breaking changes.
3. **Release Commit**: Commit changes with a message format matching `chore(release): version {{VERSION}}`.
4. **Git Tagging**: Create a git tag pointing to the release commit (e.g. `git tag -a v{{VERSION}} -m "Version {{VERSION}}"`).
5. **Merge to Main**: Ensure all release updates are merged into the default branch `{{DEFAULT_BRANCH}}`.
