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

## Post-Phase-169 numbers (added 2026-10-03, Phase 169 plan 13; D-30)

Measured on `fix/888-review-findings` at `9e3301a35` + the baseline rewrite (`ab0857938`), 2026-10-03T19:00Z:

| Reading | Before Phase 169 (this todo, 2026-09-03) | After Phase 169 |
|---|---|---|
| `yarn audit:deps` (high+) | 70 accepted (64 high / 6 critical) | **0 accepted, 0 NEW**, exit 0 — every accepted row was fixed in the tree, and `security/audit-baseline.json` now has `accepted: []` |
| `yarn npm audit --severity moderate` | 69 moderate | 1 line, a deprecation notice (`whatwg-encoding` 3.1.1 via `cheerio` → `encoding-sniffer`), no moderate advisory |
| `yarn npm audit --severity low` | 14 low | 2 low: `cookie` 0.6.0 (GHSA-pxg6-pf52-xh8x, via `@sveltejs/kit` 2.70.3; leaves with Kit 3) and `esbuild` 0.27.7 (GHSA-g7r4-m6w7-qqqr, Windows dev server only, via `tsup` 8.5.1) |

Details per row: `169-EVIDENCE.md` § 6 (the 68 dropped baseline rows, each checked against GitHub's range and the
resolved version) and § 8 (the moderate/low list).

**The Deno-import blind spot.** `yarn audit:deps` reads `yarn.lock`; the Supabase Edge Functions import with Deno
`npm:` specifiers that no manifest declares, so the gate cannot see them. On 2026-10-03 `send-email` still runs
`npm:nodemailer@6.9.10` (6 high advisories, held by the age rule until 2026-10-04T07:51Z, todo
`2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`) while the gate exits 0. Dependabot will not see it either
(no manifest). Structural fix: `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`.

**What this changes for the reconciliation.** After v2.15 merges, the expectation above becomes: the high+ set
Dependabot reports should converge on **zero** for this lockfile (plus whatever is published in the interim), and any
high+ alert on a package that IS in `yarn.lock` at a version inside its range is a gate-blindness finding. Widening
Dependabot to the monorepo is `2026-10-03-widen-dependabot-after-v2-15-merge.md`. This todo stays pending until then.

