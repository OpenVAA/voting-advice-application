---
phase: 158
slug: routing-auth-surface-harmonisation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-08-28
---

# Phase 158 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by `/gsd-plan-phase 158` from `158-RESEARCH.md` § "Validation Architecture" (`:1830-1901`).
> The Per-Task Verification Map is filled once `158-*-PLAN.md` task IDs exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | vitest (`apps/frontend/vitest.config.ts`, jsdom, globals) |
| **E2E framework** | Playwright (`tests/playwright.config.ts`, ~45 projects) |
| **Config file** | `apps/frontend/vitest.config.ts` · `tests/playwright.config.ts` · `apps/frontend/eslint.config.mjs` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Static-scan command** | `yarn lint:check` (turbo lint + `eslint tests` + `typecheck:tests` + `typecheck` + i18n/a11y asserts) |
| **Full suite command** | `yarn test:e2e` (**153 tests**, measured at the 158-09 gate: 150 before 158-16, +3 for its setup/spec/teardown) |
| **Estimated runtime** | quick ~seconds · `lint:check` ~1–2 min · full E2E ~10–15 min |

**E2E prerequisites (project-standing, non-negotiable):** one fresh dev server on `:5173`
(no Playwright `webServer` — a stale server steals the port), a clean DB via `yarn db:reset`,
and the served-application preflight must pass. Per `CLAUDE.md`, a failing E2E test is a
**cardinal failure** and there is no "known-flaky" exemption.

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn typecheck` (seconds)
- **After every plan wave:** `yarn lint:check` (includes `typecheck:tests` — the codemod's real gate) + `yarn test:unit`
- **After any wave touching routes, auth or testids:** `yarn test:e2e` **full suite**, fresh dev server + `yarn db:reset`
- **Before `/gsd-verify-work`:** full suite green **and** the negative-control ledger complete
- **Max feedback latency:** ~90 seconds (quick + typecheck)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 158-01 T1 | 01 | 1 | REVIEW-RT-03 | — | Decision: whole-directory move vs split | checkpoint:decision | operator-answered; recorded in `158-01-SUMMARY.md` | ✅ | ✅ pass |
| 158-01 T2 | 01 | 1 | REVIEW-RT-03/04/05 | T-158-48 | One route locus, one pattern, one consumer | unit + static | `test:unit` → `routes/*`; `git grep utils/route` (frontend) → 0, control 31 | ✅ | ✅ pass |
| 158-01 T3 | 01 | 1 | REVIEW-RT-03 | — | Both hook redirects go through `buildRoute` | unit | `test:unit` → `buildRoute.redirects.test.ts` | ✅ | ✅ pass |
| 158-02 T1 | 02 | 2 | REVIEW-RT-04 | — | Pattern ↔ route tree ↔ hook agree (C1–C4) | unit | `test:unit` → `routeConsistency.test.ts` | ✅ | ✅ pass |
| 158-02 T2 | 02 | 2 | REVIEW-RT-04 | T-158-46 | The guard is observed failing before it is trusted | negative control | ledger § A, 3 controls, verbatim output | ✅ | ✅ pass |
| 158-03 T1 | 03 | 3 | REVIEW-RT-02 | — | Names cannot collide; map frozen | unit | `test:unit` → `cookies.test.ts` | ✅ | ✅ pass |
| 158-03 T2 | 03 | 3 | REVIEW-RT-02 | — | Every write site reads the const module | static + unit | `assert:cookie-names` → 783 files, 0 violations | ✅ | ✅ pass |
| 158-03 T3 | 03 | 3 | REVIEW-RT-02 | T-158-46 | A literal at a write site fails the chained gate | negative control | ledger § B, 6 controls (4 plants + 2 green) | ✅ | ✅ pass |
| 158-04 T1 | 04 | 1 | REVIEW-RT-06 | — | The 3 states yield the same props as before | unit (characterisation) | `test:unit` → `candidateHome.helpers.test.ts`, 12 cases | ✅ | ✅ pass |
| 158-04 T2 | 04 | 1 | REVIEW-RT-06 | — | Component thinned onto the pure helper | unit | same spec, run after the rewrite | ✅ | ✅ pass |
| 158-04 T3 | 04 | 1 | REVIEW-RT-07 | — | Decision: drop or keep optional chaining | checkpoint:decision | recorded in `158-04-SUMMARY.md` | ✅ | ✅ pass |
| 158-04 T4 | 04 | 1 | REVIEW-RT-07 | — | No test-only wrapper, no theme-colour default | static | `git grep profile-image-error` → 0 (control 4); `?? '#'` → 0 (control 4) | ✅ | ⚠ pass, maintenance arm unexercised (DEF-158-01) |
| 158-05 T1 | 05 | 2 | REVIEW-RT-01 | — | The generic API login route is absent | static (absence + control) | 5 absence searches 0, 6 controls non-zero | ✅ | ✅ pass |
| 158-05 T2 | 05 | 2 | REVIEW-RT-01/05 | T-158-49 | One helper; one role-set declaration | unit | `test:unit` → `passwordLogin.test.ts` | ✅ | ✅ pass |
| 158-05 T3 | 05 | 2 | REVIEW-RT-01 | — | Both entry points thinned onto the helper | unit + e2e | `test:unit`; `candidate-journey` in the full suite | ✅ | ✅ pass |
| 158-05 T4 | 05 | 2 | REVIEW-RT-05 | — | The upstream allowlist state, read and recorded | manual | recorded in `158-05-SUMMARY.md` | ✅ | ✅ pass |
| 158-06 T1 | 06 | 4 | REVIEW-RT-05 | T-158-30 | Production allowlist + locale fallback confirmed | checkpoint:human-verify | operator answers (a)(b)(c) quoted verbatim | ✅ | ✅ pass |
| 158-06 T2 | 06 | 4 | REVIEW-RT-03/05 | — | Both endpoints moved under `/api`; 5 redirects rebuilt | e2e | `candidate-journey` in the full suite | ✅ | ✅ pass |
| 158-06 T3 | 06 | 4 | REVIEW-RT-05 | — | 8 consumers repointed; non-`en` locale exercised by hand | static + manual | lint allowlist re-fired; `/fi/...` → `currentLocale === 'fi'` | ✅ | ✅ pass |
| 158-07 T1 | 07 | 2 | REVIEW-RT-03 | — | OIDC error union declared once | unit | `test:unit` → `oidcError.test.ts` | ✅ | ✅ pass |
| 158-07 T2 | 07 | 2 | REVIEW-RT-03 | — | All six callback redirects via `buildRoute` | unit | same spec + `typecheck` | ✅ | ✅ pass |
| 158-08 T1 | 08 | 1 | REVIEW-RT-01 | — | Login-route callers measured; discrepancies filed | static | `158-API-LOGIN-CALLER-MEASUREMENT.md` | ✅ | ✅ pass |
| 158-08 T2 | 08 | 1 | REVIEW-RT-01..07 | — | Six follow-ups filed with verified anchors | record | `.planning/todos/pending/` entries | ✅ | ✅ pass |
| 158-08 T3 | 08 | 1 | REVIEW-RT-01..07 | — | Every triage comment dispositioned | record | `158-TRIAGE-DISPOSITIONS.md` | ✅ | ✅ pass |
| 158-08 T4 | 08 | 1 | REVIEW-RT-03 | — | The `lib/utils` move proposal | record (manual) | `158-LIB-UTILS-MOVE-PROPOSAL.md` — operator read pending | ✅ | ⚠ awaiting operator acceptance |
| 158-10 T1 | 10 | 5 | D10-C08, D10-C10 | T-158-103 | The admin path re-measured at HEAD | manual measurement | `158-ADMIN-BASELINE.md`, 8 rows × 2 DB states | ✅ | ✅ pass |
| 158-10 T2 | 10 | 5 | D10-C08 | — | Decision: criterion 8's disposition on the measured arm | checkpoint:decision | operator answered **green** | ✅ | ✅ pass |
| 158-10 T3 | 10 | 5 | D10-C08/C10 | — | Arm applied; ROADMAP corrected; ledger written | record | `158-D10-DISPOSITIONS.md` | ✅ | ✅ pass |
| 158-11 T1 | 11 | 5 | D10-C09 | — | `APP_GATES` + `isAdminRoute` in the routes locus | unit | `test:unit` → `appGates.test.ts` | ✅ | ✅ pass |
| 158-11 T2 | 11 | 5 | D10-C09 | — | The hook loops over the table; `/admin` gated | unit + e2e | `routeConsistency.test.ts`; live `/admin` → 307 | ✅ | ✅ pass |
| 158-11 T3 | 11 | 5 | D10-C09 | T-158-46 | A gated subtree with no gate row fails | negative control | ledger § C, 4 controls | ✅ | ✅ pass |
| 158-12 T1 | 12 | 5 | D10-C09 | OB-5 | What a non-admin POST actually does, measured | manual measurement | `158-SWALLOWED-ERROR-MEASUREMENT.md`, `ARM: THROWN` | ✅ | ✅ pass |
| 158-12 T2 | 12 | 5 | D10-C09 | — | Decision: OB-5's premise vs the measurement | checkpoint:decision | operator answered `thrown-pin` | ✅ | ✅ pass |
| 158-12 T3 | 12 | 5 | D10-C09 | T-158-49 | Both admin form actions carry a role gate | unit | `test:unit` → `requireAdminIdentity.test.ts` | ✅ | ✅ pass |
| 158-13 T1 | 13 | 5 | D10-C13 | — | Both subtree loads return a projection | unit | `test:unit` → `admin/layout.server.test.ts` | ✅ | ✅ pass |
| 158-13 T2 | 13 | 5 | D10-C13 | — | A fourth load reintroducing the class fails | static | `assert:no-session-in-loads` — corpus 12, floor 10 | ✅ | ✅ pass |
| 158-13 T3 | 13 | 5 | D10-C13 | T-158-46 | The guard observed red, then green | negative control | ledger § D, 4 controls incl. anti-vacuity | ✅ | ✅ pass |
| 158-14 T1 | 14 | 5 | OB-1 (D10-C08/C11) | — | Each admin subtree gets its own cookie-array load | unit | `test:unit` → `(protected)/layout.server.test.ts`, 15 cases | ✅ | ✅ pass |
| 158-14 T2 | 14 | 5 | OB-1 | — | Both universal loads read their own data; parallel again | negative control | ledger § E, 6 controls incl. E6's 401 ms overlap | ✅ | ✅ pass |
| 158-15 T1 | 15 | 6 | D10-C09 | OB-5 | The response seam refuses a refused response | unit | `test:unit` → `universalAdapter.test.ts` | ✅ | ✅ pass |
| 158-15 T2 | 15 | 6 | D10-C09 | — | An invalid job id is refused before the pipeline | unit | `test:unit` → `adminJobLifetime.test.ts` | ✅ | ✅ pass |
| 158-15 T3 | 15 | 6 | D10-C09 | T-158-46 | The four round trips, recorded and reconciled | negative control | ledger § F, 4 controls | ✅ | ✅ pass |
| 158-16 T1 | 16 | 7 | D10-C11 | — | An admin identity minted at run time, with rollback | e2e setup | `data-setup-admin-auth`, 124/153 | ✅ | ✅ pass |
| 158-16 T2 | 16 | 7 | D10-C11 | T-158-45 | Project wiring, with the scheduling measured | e2e wiring | `158-ADMIN-E2E-SCHEDULING.md`, two readings | ✅ | ✅ pass |
| 158-16 T3 | 16 | 7 | D10-C11/C08/C12 | T-158-45 | Cold entry, reload, jobs call, payload, job write | e2e | `admin-access` spec, 125/153, green in full suite | ✅ | ✅ pass |
| 158-17 T1 | 17 | 8 | D10-C12 | — | A job client carrying a credential, writing no cookies | unit | `test:unit` → `supabase/job.test.ts` | ✅ | ✅ pass |
| 158-17 T2 | 17 | 8 | D10-C12 | — | Both features resolve the session once | unit | `test:unit` → `adminJobLifetime.test.ts` | ✅ | ✅ pass |
| 158-17 T3 | 17 | 8 | D10-C12 | T-158-46 | The round trip + the gate on both sides | negative control + e2e | ledger § G, 3 controls; 130 before / 130 after | ✅ | ✅ pass |
| 158-09 T1 | 09 | 9 | D-N1 | T-158-48/50 | No authored comment carries a planning path; one logger idiom | static (diff scan) | phase-diff added-line scan; `assert:comment-hygiene` 0 | ✅ | ✅ pass (2 violations found and fixed) |
| 158-09 T2 | 09 | 9 | all | T-158-46/47 | The ledger is complete and residue-free | audit | 30 controls counted; `git status` clean | ✅ | ✅ pass (count discrepancy reported) |
| 158-09 T3 | 09 | 9 | all | T-158-45/100/101/102 | The cardinal gate, in the eight-step order | e2e + full chain | `yarn test:e2e` → 153 passed, exit 0 | ✅ | ✅ pass |

**Requirement → test map (from RESEARCH.md `:1856-1880`), which the task map must cover:**

| Req | Behaviour | Layer | Automated command | Exists? |
|---|---|---|---|---|
| REVIEW-RT-01 | shared helper reproduces the three old paths' outcomes | unit | `…test:unit` → `src/lib/auth/passwordLogin.test.ts` | ❌ Wave 0 |
| REVIEW-RT-01 | login → protected home; logout → login | e2e | `yarn test:e2e --project=candidate-journey` | ✅ |
| REVIEW-RT-02 | a cookie-name literal at a write site fails the gate | static | `node scripts/assert-cookie-names.mjs` | ❌ Wave 0 |
| REVIEW-RT-02 | two names cannot collide; map is frozen | unit | `…test:unit` → `src/lib/cookies/cookies.test.ts` | ❌ Wave 0 |
| REVIEW-RT-02 | OIDC cookie round-trip still works | e2e | `yarn test:e2e --project=bank-auth` | ✅ |
| REVIEW-RT-03 | no `$lib/utils/route` specifier survives | static | `grep -rn "utils/route" apps packages tests --exclude-dir=node_modules` → 0 | ✅ |
| REVIEW-RT-03 | every importer still resolves | static | `yarn typecheck && yarn typecheck:tests` | ✅ |
| REVIEW-RT-03 | `buildRoute` reproduces the hand-built strings (Tier 1) | unit | `…test:unit` → `src/lib/routes/buildRoute.redirects.test.ts` | ❌ Wave 0 |
| REVIEW-RT-04 | pattern ↔ route tree ↔ hook agree (C1–C4) | unit | `…test:unit` → `src/lib/routes/routeConsistency.test.ts` | ❌ Wave 0 |
| REVIEW-RT-04 | unauth visit to a protected route redirects with `redirectTo` | e2e | `yarn test:e2e --project=candidate-journey` | ✅ |
| REVIEW-RT-05 | permissions mapping has exactly one home | static | `grep -rn "project_admin" apps/frontend/src` → 1 file | ✅ |
| REVIEW-RT-05 | the moved `/api` callback still completes invite + recovery | e2e | `yarn test:e2e --project=candidate-journey` | ✅ |
| REVIEW-RT-06 | the 3 states yield the same 7 props as before | unit | characterisation test, written **before** the rewrite | ❌ Wave 0 |
| REVIEW-RT-06 | home page renders status/tip/buttons per state | e2e | `--project=candidate-journey --project=perm-answers-locked` | ✅ |
| REVIEW-RT-07 | portrait error addressable as a child of the upload container | e2e | `yarn test:e2e --project=candidate-journey` | ✅ |
| REVIEW-RT-07 | no `profile-image-error` remains | static | `grep -rn "profile-image-error" apps tests --exclude-dir=e2e-runs` → 0 | ✅ |
| REVIEW-RT-07 | no theme-colour default remains | static | `grep -n "?? '#" apps/frontend/src/routes/+layout.svelte` → 0 | ✅ |
| D-N1 | no planning-artifact path in any comment this phase adds | static | `git diff \| grep` per RESEARCH § J.4 | ⚠ **CORRECTED at the 158-09 gate.** A comment scan IS chained (`assert:comment-hygiene`, in `lint:check`) — but it reports `rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break)` and has **no planning-reference rule at all**, plus a standing prohibition on dash rules. So the chained script does NOT enforce D-N1; the diff scan remains its ONLY enforcement, and it is not chained anywhere. |

---

## Wave 0 Requirements

- [x] `apps/frontend/src/lib/cookies/cookies.test.ts` — collision + `Object.isFrozen` (RT-02 failure mode ii)
- [x] `scripts/assert-cookie-names.mjs` + wiring into `package.json` `lint:check` (RT-02 failure mode i)
- [x] `apps/frontend/src/lib/routes/routeConsistency.test.ts` — C1–C4 (RT-04)
- [x] `apps/frontend/src/lib/auth/passwordLogin.test.ts` — three outcomes × two role sets (RT-01)
- [x] characterisation test for the `nextAction` states (RT-06) — **written against current behaviour BEFORE the rewrite**
- [x] `buildRoute` round-trip test for `redirectTo` percent-encoding (RT-03 Tier 2)
- [x] `158-NEGATIVE-CONTROL-LEDGER.md` — 6 plants for RT-02, 3 for RT-04; **every guard demonstrated failing before it is claimed to guard**
- [x] No framework install needed — vitest, Playwright and ESLint are present and wired

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase **Cloud** redirect allowlist accepts the moved `/api` auth callback | REVIEW-RT-05 | Out of repo — a production dashboard setting; `apps/supabase/supabase/config.toml:167` covers local only | Operator updates the Cloud allowlist to the new path before the 158-06 move is deployed |
| Paraglide URL-locale prefix is dropped by the `/api` move; callback degrades to `locals.currentLocale ?? 'en'` | REVIEW-RT-05 | **E2E cannot catch it** — the fixtures hard-code `/en/`, so a non-`en` regression passes silently | Exercise the moved callback under a non-`en` locale by hand, or add a non-`en` fixture |
| The `lib/utils` move **proposal** is the right set of sections | REVIEW-RT-03 (D-G1 NOTES) | A judgement document, not code; nothing moves on its strength in this phase | Operator reads and accepts/amends `158-LIB-UTILS-MOVE-PROPOSAL.md` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — 51 rows above, none a placeholder
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — all eight items delivered
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] Negative-control ledger complete — **30** controls, each observed failing then removed. NOTE: the baseline this line was written against was 9; the phase appended five further sections (C–G). Counted at the gate against the ledger's own headings, not against this sentence.
- [ ] `nyquist_compliant: true` set in frontmatter — **left unticked deliberately.** This is `/gsd-validate-phase` § 6's field to set, not the executor's, and the file's own frontmatter comment says so. An unticked box is information.

**Approval:** the automated evidence is complete and green (see `158-09-SUMMARY.md`). TWO items are
NOT covered by it and are stated rather than assumed:

1. **`158-LIB-UTILS-MOVE-PROPOSAL.md` awaits an operator read** — a judgement document; nothing in
   the tree moves on its strength, so it blocks no code.
2. **The `PLAYWRIGHT_BANK_AUTH`-gated projects have not run since `158-03` rewrote the cookie
   names.** This is the only behavioural evidence that the OIDC cookie round trip still completes,
   and it needs a rig (mock issuer + the frontend server's own IdP env) that is operator
   responsibility. Logged in `WINDOWS.md`, not closed.
