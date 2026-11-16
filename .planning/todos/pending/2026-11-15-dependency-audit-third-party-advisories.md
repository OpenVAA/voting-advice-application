---
title: Clear the dependency audit's 16 new third-party advisories at high+ (dependency-audit job of main.yaml)
priority: medium
source: Phase 187 plan 187-15 (read 2026-11-16 on run 43817899191, `ci-evidence/187-final` at 395b71c71); carried CI debt G-03
target: Phase 189 (Documentation and Closure)
---

The `dependency-audit` job of `main.yaml` concluded `failure` on run
[43817899191](https://github.com/OpenVAA/voting-advice-application/actions/runs/43817899191) (job 133134035449),
the push of the phase-187 final tree as `ci-evidence/187-final` at `395b71c712f9af6a80512625f2b38baf93167c1a`.
The reading was made on 2026-11-16. The file is dated 2026-11-15, the date in plan 187-15's path. `yarn audit:deps`
compares against `security/audit-baseline.json` (recorded 2026-10-03 at `9e3301a35`, 0 accepted advisories) and
printed:

```
Summary: 16 new advisory(ies) at high+, 0 accepted
```

| Severity | Package | Audit id | Advisory |
|----------|---------|----------|----------|
| critical | dompurify | 1242880 | GHSA-cg2g-xh64-v4q7 |
| critical | shell-quote | 1241332 | GHSA-pqg4-j6r4-53mv |
| high | compression | 1241221 | GHSA-vc2v-76pw-4v95 |
| high | dompurify | 1242881 | GHSA-mrv2-3pqr-j5jr |
| high | launch-editor | 1242663 | GHSA-587h-7wmj-h5pm |
| high | source-map-js | 1241209 | GHSA-68fv-2mgg-jv7q |
| high | undici | 1243112, 1243113 | GHSA-xjj6-f33q-929c |
| high | undici | 1243472, 1243473 | GHSA-4w7w-5xrc-9h26 |
| high | undici | 1243474, 1243475 | GHSA-2m5v-pch6-74hx |
| high | undici | 1243477, 1243478 | GHSA-qrxm-fqhp-jwvm |
| high | vite | 1242662 | GHSA-587h-7wmj-h5pm |
| high | zod | 1243066 | GHSA-mrhx-c7xc-m3w5 |

That is 16 audit ids over 11 distinct GHSA ids. The undici ids come in pairs, two resolved versions per advisory.

**The cause is outside this workstream.** The deployment workstream (phases 183 to 189) has changed the lockfile once.
Commit `07690d24d` (187-08) added `js-yaml` to the root devDependencies from the catalog, a one-line `yarn.lock`
change, and `js-yaml` has none of the advisories above. Its other manifest commits (`4c356f947`, `613589378`,
`7e84a319b`, `491a6476c`, `013775349`) add root scripts only. Every advisory names a third-party package that the
workstream did not add. The research of phase 187 (§ Carried CI debts) read the same summary line before this
phase's work.

**What closes it.** Upgrade or replace each affected dependency, or accept a finding with a written rationale through
a reviewed `--update-baseline` run. The audit's own instruction is never to silence a finding by package name. Then
observe `dependency-audit` concluding `success`, read at job level, on a `ci-evidence/**` push or on `main`.

## 2026-11-16: one new row on run 43938990256 (plan 187-27)

After the rebase onto the -gsd stream, `yarn audit:deps` on run 43938990256 (`ci-evidence/187-final-3`, head
`2b0842fd4`) printed `Summary: 17 new advisory(ies) at high+, 0 accepted`: the 16 rows above, unchanged, and one
new row from the rebase's lockfile.

| severity | package | audit id | GHSA |
| --- | --- | --- | --- |
| high | @sveltejs/kit | 1247438 | GHSA-3r8g-jcqq-3p5j |

`@sveltejs/kit` is a third-party package the deployment workstream did not add (its one added package is still
`js-yaml`), so the row is appended here and owned by phase 189 like the others.
