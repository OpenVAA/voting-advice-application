# Phase 158 — Requirement Discrepancy Register

**Re-measured:** 2026-09-01, at HEAD `3c958cccc`. Every line number below was opened in this task.
**None was copied from `158-RESEARCH.md`, `158-CONTEXT.md` or `.planning/ROADMAP.md`.**
**Produced by:** `158-08`, Task 1. **Scope:** `REVIEW-RT-01` … `REVIEW-RT-07`, `.planning/REQUIREMENTS.md:141-147`.

---

## Read this first — the reading rule this phase adopts

**The requirement text is stale. The code is not wrong.** Every discrepancy below is a *coordinate*
that has moved since the requirement was written — a line number that drifted under an unrelated
edit, an expression that a sibling plan has already rewritten, a "does not exist yet" that now
exists. Not one of them is a case of the tree failing to do what the reviewer asked.

The rule, stated once and applied throughout:

> **The requirement file is authoritative for INTENT. This phase's measured facts are authoritative
> for COORDINATES.** Where the two disagree about *what should be true*, the requirement wins. Where
> they disagree about *where it is*, the measurement wins.

**None of the discrepancies below changes what this phase must do.** They change only where a
verifier should look while checking that it did it. A verifier that traces Phase 158's work against
the requirement's line numbers will fail correct work; that is the failure this register exists to
prevent.

**This register edits nothing.** `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` and
`.planning/STATE.md` are untouched by this phase — nine phases are being planned against this tree
concurrently, and routing the correction is the operator's call, not an executor's. The register is
surfaced as **information, not a gate**.

---

## The register

| # | Req | The claim as written | The measured truth at `3c958cccc` | Evidence |
|--:|-----|----------------------|-----------------------------------|----------|
| 1 | **REVIEW-RT-01** | "…the generic `/api` login route is **deleted rather than kept** if the collapse leaves it unused" — phrased as work this phase performs | **The clause already fired, upstream.** The route was deleted at `8ecfc9002` (`157.2-04`) before Phase 158 opened. `api/auth/` now holds one file. The *collapse* half of the requirement is still open and is `158-05`'s. | `git log --diff-filter=D -- 'apps/frontend/src/routes/api/auth/login/+server.ts'` → `8ecfc9002`; `find apps/frontend/src/routes/api/auth -type f` → `apps/frontend/src/routes/api/auth/logout/+server.ts` only. Full workup: `158-API-LOGIN-CALLER-MEASUREMENT.md` |
| 2 | **REVIEW-RT-02** | "the 18th is a raw `document.cookie` write at **`routes/candidate/preregister/+page.svelte:111`**" | The write is at **`:108`** — a 3-line drift. Its content is otherwise exactly as described, and it is still the app's only producer of `oidc_code_verifier`. | `apps/frontend/src/routes/candidate/preregister/+page.svelte:108` — `document.cookie = \`oidc_code_verifier=${codeVerifier}; path=/; max-age=600; secure; samesite=lax\`` |
| 3 | **REVIEW-RT-02** | "**4 names** … across **6 files / 18 sites** … 17 are `cookies.get/set/delete` calls" — and three prior sources give three different totals | **The requirement's totals are RIGHT and the research table's line numbers are WRONG.** Measured: 17 `cookies.*` sites across **5** files, plus the one `document.cookie` write in a 6th = **18 across 6**, 4 names, `lib/cookies` still absent. But **17 of the 18 line numbers in `158-RESEARCH.md` § C.1 have drifted** (only `api/candidate/preregister/+server.ts:6` survived); the drift is `152-14`'s 3,411-forced-line-break unwrap. Fact 22's "17" scoped to `cookies.*` and missed the `document.cookie` site; the ROADMAP's "17 across 5" made the same omission. | `git grep -nE "cookies\.(get\|set\|delete)\('(id_token\|oidc_state\|oidc_nonce\|oidc_code_verifier)'" -- apps/frontend/src` → 17 lines / 5 files. Current sites: `api/oidc/callback/+server.ts:39,42,43,47,52,54,80,82,86` (9) · `api/oidc/authorize/+server.ts:27,36` (2) · `api/oidc/token/+server.ts:33,51` (2) · `candidate/preregister/+layout.server.ts:34,43` (2) · `api/candidate/preregister/+server.ts:6,43` (2) · `candidate/preregister/+page.svelte:108` (1) |
| 4 | **REVIEW-RT-03** | "the routes code lives at `apps/frontend/src/lib/utils/route/{buildRoute.ts,route.ts}` **today** and **`lib/routes` does not exist**, so this is a move plus an import codemod" | **Both halves are now false, and in the direction the requirement wanted.** `apps/frontend/src/lib/routes/` exists and is the live locus; `apps/frontend/src/lib/utils/route/` **no longer exists** — the whole directory moved. Delivered by `158-01` in this same wave (D-G1 widened from two files to whole-directory on the operator's answer). | `ls apps/frontend/src/lib/utils/` → `aria color matching questions text` (no `route`). Importers now read `$lib/routes`: `apps/frontend/src/routes/admin/login/+page.server.ts:9`, `apps/frontend/src/routes/candidate/login/+page.server.ts:9`, `apps/frontend/src/hooks.server.ts:8`. See `158-01-SUMMARY.md` |
| 5 | **REVIEW-RT-04** | "`hooks.server.ts:69`'s `pathname.includes('/candidate')` is gone, `route.id` already being in scope at `:59` and already used for the `(protected)` check at `:74`" — with a ⚠ correction note arguing `:69` over `:68` | **Two of the three named expressions no longer exist in any form, and the third has moved.** ⚠ **This phase does not supply a replacement triple.** The numbers for this file have drifted four times in eight days (obligation **OB-4**), twice through unrelated phases editing its imports, and a correction pass once replaced a right number with a wrong one. A fifth transcription would be the same mistake. **Phase 158 anchors on expressions for this file, per decision C1(a) and OB-4.** | Anchors **as expressions**, at HEAD: `const { url, route } = event;` — **present**, opening `candidateAuthHandle`. `pathname.includes('/candidate')` — **absent**, replaced by `isCandidateRoute(routeId)`. `route.id.includes('(protected)')` — **absent**, replaced by `isProtectedRoute(routeId)`. Both predicates are imported from `$lib/routes`. Delivered by `158-01`; `hooks.server.ts` was untouched by all of Phase 157.2 (OB-4) |
| 6 | **REVIEW-RT-05** | "the permissions mapping at **`admin/login/+page.server.ts:43`** is a shared auth utility" | **The anchor is wrong AND the substantive half is not delivered — while the requirement checkbox says it is.** The role-membership test is at **`:39`**, not `:43`; `:43` is a `log.debug` call. The triple `['project_admin', 'account_admin', 'super_admin']` is still **inline** there and is **duplicated** at `supabaseDataWriter.ts:194`. `lib/auth/` holds only `getUserData.ts` and `index.ts` — **no `roles.ts`**. The other half of RT-05 (`loginRedirectTarget.ts` in `$lib/routes/`) **is** delivered. `REQUIREMENTS.md:145` is `[x]`; that checkbox overstates. `158-05` owns the remainder. | `apps/frontend/src/routes/admin/login/+page.server.ts:39` (the test) vs `:43` (`log.debug('Unauthorized user tried to access admin app')`); `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:194` (the duplicate); `ls apps/frontend/src/lib/auth/` → `getUserData.ts index.ts` |
| 7 | **REVIEW-RT-06** | "`candidate/(protected)/+page.svelte:38` takes each prop's default once and lets cases specify only overrides" | **Delivered, at a different address.** The file is now 147 lines. `:38` is `const missingInfoCount = $derived(…)` — one OF the precomputed facts the requirement asked for, under a `// Precomputed facts` banner at `:32-34`; the branch chain and badge set moved out to `./candidateHome.helpers` (`computeBadges`, `computeNextAction`). Delivered by `158-04`. | `apps/frontend/src/routes/candidate/(protected)/+page.svelte:18` (the helper import), `:32-44` (the precomputed block), `:52-60` (`computeNextAction` call). See `158-04-SUMMARY.md` |
| 8 | **REVIEW-RT-07** | "the test id at **`profile/+page.svelte:289`** moves to the parent (⚠ corrected from `:281`)" | **Delivered, and neither number is where it is now.** `:289` at HEAD is `<div data-testid="candidate-profile-info-item">`, an unrelated element. The portrait-upload block is at `:274-282`: the testid rides on the existing `Input` via `containerProps={{ 'data-testid': 'profile-image-upload' }}` at `:282`, and `:274` carries a comment recording that **no wrapper element is needed**. There is no test-only element. Delivered by `158-04`. | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:274`, `:282`, `:289` |
| 9 | **REVIEW-RT-07** | "**both** theme-colour defaults are removed, at `src/routes/+layout.svelte:215` **and `:219`** (the requirement previously named one)" | **The count of two is right; both numbers are wrong; the work is done.** The two `<meta name="theme-color">` elements are at **`:195` and `:196`** — adjacent, not four lines apart — and neither carries a default: both read `staticSettings.colors.{light,dark}['base-300']` directly. Delivered by `158-04` (`ca88d124e`). | `apps/frontend/src/routes/+layout.svelte:195`, `:196`; `git log --oneline -1 -- apps/frontend/src/routes/+layout.svelte` → `ca88d124e refactor(158-04): drop the test only wrapper, the theme colour defaults and the inverted title` |
| 10 | **REVIEW-RT-07** | "the maintenance title renders per the reviewer's markup at `:212`" | **Delivered, at `:99`, and the file's `:212` is not a title site.** `documentTitle` is `` `${t('dynamic.appName')}${underMaintenance ? ` – ${t('maintenance.title')}` : ''}` `` — the reviewer's markup exactly. ⚠ **But the suffix does not reach a rendered page**: `deferred-items.md` **DEF-158-01** records that `access.underMaintenance` arrives in the served loader payload and neither the maintenance page nor the title suffix renders. That is a live defect against RT-07's *intent*, filed and open; it is not a coordinate problem and is not re-filed here. | `apps/frontend/src/routes/+layout.svelte:92` (`underMaintenance`), `:99` (`documentTitle`), `:216` (`{:else if underMaintenance}`); `.planning/phases/158-routing-auth-surface-harmonisation/deferred-items.md` § DEF-158-01 |

**Ten rows. The plan owes at least six.**

---

## The pattern behind all ten

Nine of the ten are the same failure with different coordinates: **a line number written down once
and then read as if it were an identity.** The three mechanical causes, all measured:

1. **`152-14` unwrapped 3,411 forced line breaks across `apps/`.** Every multi-line comment block
   that collapsed to one line shifted everything below it up. This is what moved 17 of the 18 cookie
   sites and the profile-page and layout anchors.
2. **`152`'s comment-hygiene purge deleted the planning-artifact-citing comments** the reviewer had
   anchored some remarks to. The anchor did not move — its subject was removed. (Two instances,
   dispositioned in `158-TRIAGE-DISPOSITIONS.md` § 2.)
3. **Sibling plans in this same wave delivered the work.** `158-01` and `158-04` between them
   discharged rows 4, 5, 7, 8, 9 and 10 — which is why the requirement's "today the code looks like
   X" clauses now describe a tree that no longer exists.

The tenth (row 6) is different in kind and is the only one a verifier should treat as a **finding**
rather than a coordinate: `REVIEW-RT-05` is checked complete in `REQUIREMENTS.md` while half of it —
the shared permissions utility — is unbuilt and its role triple is still duplicated across two
production files.

---

## For the operator — the routing decision

Surfaced, not actioned. Four candidate corrections, in descending order of consequence:

1. **`REQUIREMENTS.md:145` (`REVIEW-RT-05`) is ticked but half-delivered.** This is the one that can
   cause real harm: a ticked requirement stops being re-checked. `158-05` is planned to finish it;
   until it lands, the tick is ahead of the tree.
2. **Ban line numbers for `hooks.server.ts` in the requirement text**, as this phase has done
   internally (C1(a) / OB-4). Four drifts in eight days is enough evidence that the transcription is
   the defect, not the transcriber.
3. **`REVIEW-RT-03`'s "`lib/routes` does not exist"** and **`REVIEW-RT-04`'s three anchors** now
   describe the pre-`158-01` tree. They read as unmet when they are met.
4. **`158-RESEARCH.md` § C.1's 18-row cookie table** is a useful table with 17 wrong numbers. Its
   *totals* are correct and are the part later plans consume; its *coordinates* should be re-measured
   by whichever plan writes the cookie const module (`158-02`), not trusted.

**This phase performs none of these edits.** `git status --porcelain .planning/REQUIREMENTS.md
.planning/ROADMAP.md .planning/STATE.md` is empty at the commit that carries this file.
