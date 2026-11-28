---
created: 2026-11-28
title: Auto-reload the maintenance page when the app is back
area: frontend
tags: [voter, contestant, frontend, ui, improvement]
keywords: [maintenance-page, polling, under-maintenance, health-check, auto-reload]
source: "GitHub issue #505"
github_issues: [505]
files:
  - apps/frontend/src/lib/layouts/main/MaintenancePage.svelte
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/api/health
---

# Auto-reload the maintenance page when the app is back

## Origin

Converted from GitHub issue [#505 feat: poll server state periodically when showing MaintenancePage](https://github.com/openvaa/voting-advice-application/issues/505) on 2026-11-28.

## Problem

When `access.underMaintenance` is true (or the backend cannot be reached), `routes/+layout.svelte` renders `MaintenancePage`. The page never re-checks, so visitors stay on it until they reload manually.

## Solution

In `MaintenancePage` (or the root layout) poll at a modest interval with backoff, e.g. via `invalidateAll()` or a lightweight endpoint (`routes/api/health` or a public settings read), and re-render when maintenance is lifted. Stop polling when the tab is hidden. Announce the change politely for screen readers.
