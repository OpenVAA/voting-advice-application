---
created: 2026-11-28
title: Add Mendez agreement-score option to matching
area: matching
tags: [matching, feat]
keywords: [mendez, missing-values, imputation, agreement-score, matching-algorithm]
source: "GitHub issue #846"
github_issues: [846]
files:
  - packages/matching/src/missingValue/missingValueMethod.ts
  - packages/matching/src/missingValue/impute.ts
  - packages/matching/src/distance/
  - packages/matching/README.md
---

# Add Mendez agreement-score option to matching

## Origin

Converted from GitHub issue [#846 feat[matching]: Mendez method for imputing missing answers](https://github.com/openvaa/voting-advice-application/issues/846) on 2026-11-28.

## Problem

Mendez (2017, pp. 50-51) proposes recommendation scores from -100 to +100: per-statement agreement is summed and divided by the number of statements the voter answered, and a missing candidate answer contributes 0, so non-response pulls the score towards the midpoint. Example: the voter answered 30, the candidate 15, all identical: 15/30 = +50. `@openvaa/matching` supports only `Neutral` and `RelativeMaximum` missing-value imputation (`packages/matching/src/missingValue/`), and Neutral is not equivalent (a voter's neutral answer vs. a missing one counts as full agreement).

## Solution

Add a missing-value method (or a distinct metric) that treats a missing target value as contributing exactly half the maximum distance on that dimension regardless of the voter's answer, which on a normalised 0-100% distance scale reproduces Mendez's 0 agreement. Document the mapping between Mendez's -100..+100 and OpenVAA's 0-100%. Unit-test the paper's example.
