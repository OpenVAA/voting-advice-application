---
created: 2026-11-28
title: Make the Voter App embeddable on other sites
area: frontend
tags: [voter, frontend, infra, feat]
keywords: [embed, iframe, media-partners, frame-ancestors, embedded]
source: "GitHub issue #553"
github_issues: [553]
files:
  - apps/frontend/svelte.config.js
  - apps/frontend/src/hooks.server.ts
  - infra/modules
  - apps/docs/src/routes/(content)/publishers-guide
---

# Make the Voter App embeddable on other sites

## Origin

Converted from GitHub issue [#553 feat: make Voter App embeddable](https://github.com/openvaa/voting-advice-application/issues/553) on 2026-11-28.

## Problem

VAAs are commonly embedded in media sites. Nothing in OpenVAA supports or tests this: `apps/frontend/svelte.config.js` does not use `kit.embedded`, no CSP `frame-ancestors`/`X-Frame-Options` policy is set by the app or the CloudFront config under `infra/`, and cookie/localStorage behaviour inside a third-party iframe (SameSite, storage partitioning) is unknown.

## Solution

Decide between iframe embedding (allowlist of embedding origins via a setting -> `frame-ancestors`, auto-height via postMessage, check storage partitioning) and script embedding (`kit.embedded`). Document it in the publishers' guide and add an E2E that loads the app in an iframe.
