---
created: 2026-11-28
title: Add a voter Help page and contextual help
area: frontend
tags: [voter, frontend, ui, translations, feat]
keywords: [help, contextual-help, voter-help-page, about-page, onboarding]
source: "GitHub issue #369"
github_issues: [369]
files:
  - apps/frontend/src/routes/(voters)
  - apps/frontend/src/routes/contestant/help
---

# Add a voter Help page and contextual help

## Origin

Converted from GitHub issue [#369 feat: help function](https://github.com/openvaa/voting-advice-application/issues/369) on 2026-11-28.

## Problem

The Voter App's Help button currently links to the About page; there is no real voter help. The Contestant App has its own help page (`apps/frontend/src/routes/contestant/help`), so the pattern exists. The original issue asked for a help function: short, page-specific help (e.g. a popover or drawer per route explaining what to do on that page) that links to a full Help page.

## Solution

Add a voter Help route (content from app customization, localized), point the Help button at it, and consider a per-route contextual help snippet (drawer/popover) whose text comes from customization keyed by route. Reuse the Contestant App help page structure where possible.
