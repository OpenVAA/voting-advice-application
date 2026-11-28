---
created: 2026-11-28
title: Flag TODO comments in lint or CI
area: ci
tags: [ci, tooling, improvement]
keywords: [todo-comments, lint, no-warning-comments, ci-check, tech-debt]
source: "GitHub issue #563"
github_issues: [563]
files:
  - packages/shared-config/eslint.config.mjs
  - .github/workflows
---

# Flag TODO comments in lint or CI

## Origin

Converted from GitHub issue [#563 build: add an automatic check for TODO items marked in comments](https://github.com/openvaa/voting-advice-application/issues/563) on 2026-11-28.

## Problem

About 40 `TODO` comments live in `apps/`, `packages/` and `tests/` (e.g. `apps/frontend/src/lib/api/base/dataWriter.type.ts`, `apps/frontend/src/lib/components/input/Input.svelte`, `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`). Nothing tracks them, so they rot instead of becoming todos/issues.

## Solution

Enable ESLint `no-warning-comments` (warn) in the shared config, or a CI script that fails on new TODOs (diff-based) unless they reference an issue/todo id. Triage the existing ones into `.planning/todos` first.
