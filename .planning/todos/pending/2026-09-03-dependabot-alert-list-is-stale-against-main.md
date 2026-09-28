---
title: Dependabot's 315 open alerts are measured against a pre-v2 `main` and will not reconcile with `yarn audit:deps` until v2.15 merges
created: 2026-09-03
source_phase: 163-ci-gates-sql-lint-format-secrets-vulnerability-scanning
source_plan: 05
priority: medium
suggested_phase: post-v2.15-ship
keywords: [dependabot, audit, cigate-03, security, audit-baseline, yarn-npm-audit, stale-alerts]
---

# Dependabot's alert list is stale against `main`, and the two numbers will confuse a reader

## Origin

Phase 163 plan 05 built the `dependency-audit` gate. Its accepted baseline lists **70** high+ findings, while the banner GitHub prints on every `git push` to this remote says **315 open Dependabot alerts (25 critical / 118 high / 136 moderate / 36 low)**. Anyone who reads both will reasonably conclude that the new gate is under-counting by a factor of four. It is not, and this todo records the measurement so the question does not have to be re-answered from scratch.

## What was measured (2026-09-03, `gh api repos/OpenVAA/voting-advice-application/dependabot/alerts?state=open --paginate`)

| Reading | Dependabot | `yarn npm audit --all --recursive` on this branch |
|---|---|---|
| all severities | 315 alerts, 256 distinct advisories | 153 findings |
| by severity | 25 critical / 118 high / 136 moderate / 36 low | 6 critical / 64 high / 69 moderate / 14 low |
| high and above | 143 alerts, 106 distinct advisories | 70 findings |

The gap is fully accounted for, and none of it is gate blindness:

1. **Dependabot resolves against the DEFAULT BRANCH.** `main` still carries the pre-v2 layout. Twelve alerts are against manifests that do not exist in this working tree at all: `backend/vaa-strapi/package.json` (2) and `frontend/package.json` (10).
2. **49 of the 59 distinct high+ advisories Dependabot reports and the baseline does not are for packages absent from this lockfile entirely** — `@strapi/strapi`, `@strapi/core`, `@strapi/content-type-builder`, `axios` (13), `handlebars` (5), `@xmldom/xmldom` (5), `fast-uri` (7), `tar-fs` (3), `nodemailer`, `koa`, `jws`, `sharp` and others. They are Strapi-era dependencies this milestone removed.
3. **The remaining 10 were checked one by one against the version resolved in this tree's `yarn.lock`, and every one is a range this branch has already moved past.** For example `@sveltejs/kit` GHSA-j62c-4x62-9r35 covers `>= 2.19.0, <= 2.49.4` and this tree resolves `2.55.0`; `playwright` GHSA-7mvr-c777-76hp covers `< 1.55.1` and this tree resolves `1.58.2`; `devalue` GHSA-vj54-72f3-p5jv covers `< 5.3.2` and this tree resolves `5.6.4`.
4. **Dependabot counts one alert per advisory-and-manifest pair**, so 315 alerts carry 256 distinct advisories and 143 high+ alerts carry 106.

## What to do, and when

Nothing before v2.15 merges — the alert list is a property of `main`, and no action on this branch can change it.

**After the merge**, re-run the comparison. The expectation is that the Strapi-era alerts auto-close when Dependabot re-resolves the new `main`, and that the residual high+ set converges on the baseline's 70 plus whatever has been published in the interim. If a high+ advisory survives on a package that IS in the lockfile at a version inside its vulnerable range, that IS a gate blindness finding and should be treated as one: `yarn audit:deps` would have to be missing something it can see.

The one-command reproduction is in `163-05-SUMMARY.md` § "The Dependabot discrepancy, measured".

## Not in scope here

This todo is about reconciling two counts. The question of whether the 70 accepted findings should be REDUCED (upgrading `@sveltejs/kit` past the adapter-node BODY_SIZE_LIMIT bypass, or the four critical test-toolchain rows) is a separate piece of work; those rows carry their rationale in `security/audit-baseline.json` and stay visible at every ship review by design.
