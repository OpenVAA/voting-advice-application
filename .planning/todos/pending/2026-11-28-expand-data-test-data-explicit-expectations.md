---
created: 2026-11-28
title: Expand @openvaa/data test data and use explicit expectations
area: data
tags: [data, tests, improvement]
keywords: [test-data, unit-tests, fixtures, explicit-expectations]
source: "GitHub issue #642"
github_issues: [642]
files:
  - packages/data/src/testUtils/testData.ts
  - packages/data/src/testUtils/getTestData.ts
  - packages/data/src/testUtils/parseNominations.ts
  - packages/data/src/
---

# Expand @openvaa/data test data and use explicit expectations

## Origin

Converted from GitHub issue [#642 chore: elaborate @openvaa/data test data and rewrite tests using it](https://github.com/openvaa/voting-advice-application/issues/642) on 2026-11-28.

## Problem

`TEST_DATA` in `packages/data/src/testUtils/testData.ts` is limited and misses edge cases; it should resemble a realistic VAA. Most tests in `packages/data` parse the same data (via `getTestData`, `parseNominations`) to compute expected values, which makes them hard to read and can mask bugs. Only a few tests use explicit constants (`NOMINATION_COUNTS`, `NOMINATION_COUNTS_ROUND_2`, `ENTITY_NOMINATIONS`).

## Solution

Extend the fixture (more question types, missing values, nested nominations, multiple rounds, factions/alliances), add explicit expected-value constants next to it, and rewrite tests to assert against those constants.
