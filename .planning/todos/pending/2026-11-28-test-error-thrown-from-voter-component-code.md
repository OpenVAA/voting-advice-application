---
created: 2026-11-28
title: Test and fix error() thrown from voter component code
area: frontend
tags: [voter, frontend, tests, bug]
keywords: [error-handling, sveltekit-error, derived, "404", questions-route]
source: "GitHub issue #753"
github_issues: [753]
files:
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - tests/tests/specs/voter
---

# Test and fix error() thrown from voter component code

## Origin

Converted from GitHub issue [#753 chore: test `error()` calls in reactive blocks in the Voter App](https://github.com/openvaa/voting-advice-application/issues/753) on 2026-11-28.

## Problem

SvelteKit's `error()` is designed for `load` functions; thrown from component code it is not routed to `+error.svelte` the same way and may crash the page or leave it blank. In the Voter App, `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` throws `error(404, 'Question with id ... not found.')` inside a `$derived.by` when the URL names an unknown question, and `questions/+page.svelte` calls `error(500, ...)` in a handler. No test checks how these fail.

## Solution

Add E2E (or component) tests that open `/questions/<bogus-id>` and the other error paths and assert a graceful error page. If they do not fail gracefully, move the validation into the route's `+layout.ts`/`+page.ts` load (where `error()` belongs) or render an inline error state. Grep for other `error(` calls in `.svelte` files across the apps.
