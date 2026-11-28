---
created: 2026-11-28
title: Add data-driven political map of voter and entities
area: frontend
tags: [voter, admin, frontend, matching, ui, feat]
keywords: [political-map, pca, factor-analysis, visualisation, clustering]
source: "GitHub issue #630"
github_issues: [630]
files:
  - packages/matching/
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/routes/admin/(protected)/
  - apps/frontend/src/routes/(voters)/(located)/results/
---

# Add data-driven political map of voter and entities

## Origin

Converted from GitHub issue [#630 Visual representation of candidates' positions](https://github.com/openvaa/voting-advice-application/issues/630) on 2026-11-28.

## Problem

Epic #630: voters want to see themselves, candidates and parties on a 2D map. Admins want this without predefining dimensions or question loadings (avoid subjective bias). Options: linear projection (PCA/factor analysis — first component often ≈ left-right but sign may be flipped) or clustering. Issues: interpretability of axes/clusters (ML labelling could help), precomputing with admin rotate/reflect, projecting the voter onto a precomputed map. Prototype: github.com/MemeSlayer27/entropy_reducer (factor_analyser.py). Related: the Admin App's `AdminAppFactorAnalysis` route is referenced but unbuilt.

## Solution

TBD — precompute factors per election in an admin job (store in election custom data), project voter client-side, render with an accessible chart in results. Shares the factor computation with dynamic question ordering (#631).
