---
created: 2026-11-28
title: Tighten lint, commit-message and issue-template hygiene
area: ci
tags: [ci, tooling, improvement]
keywords: [eslint, no-unused-vars, commitlint, conventional-commits, issue-template]
source: "GitHub issue #136"
github_issues: [136]
files:
  - packages/shared-config/eslint.config.mjs
  - .husky/
  - .github/
  - .github/workflows/main.yaml
---

# Tighten lint, commit-message and issue-template hygiene

## Origin

Converted from GitHub issue [#136 Pipeline Improvements](https://github.com/openvaa/voting-advice-application/issues/136) on 2026-11-28.

## Problem

Three small pipeline gaps: (1) unused variables only warn: `unused-imports/no-unused-vars` is set to 'warn' in `packages/shared-config/eslint.config.mjs` and no lint script runs with `--max-warnings 0`, so unused vars never fail CI. (2) Commit messages are not checked against Conventional Commits; `.husky/` has `pre-commit` and `post-commit` but no `commit-msg` hook and no commitlint config. (3) `.github/` has a `PULL_REQUEST_TEMPLATE` but no `ISSUE_TEMPLATE`, so issues arrive without type/scope labels.

## Solution

Promote the rule to 'error' after fixing current warnings (count them first); add commitlint with @commitlint/config-conventional via a husky commit-msg hook (and optionally a CI check on PR titles/commits); add issue forms under .github/ISSUE_TEMPLATE that prefill type/scope labels.
