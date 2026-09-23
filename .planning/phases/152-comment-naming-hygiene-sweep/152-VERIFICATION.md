---
phase: 152-comment-naming-hygiene-sweep
verified: 2026-08-29T06:45:00Z
status: passed
score: 6/6 roadmap success criteria achieved as the phase's own honest-close model defines "achieved" (2 of them — SC1, SC2 — achieved on the eleven-plus-one-family in-scope surface, deliberately NOT claimed on the full literal wording; both gaps fenced to the operator, not silently resolved)
overrides_applied: 0
behavior_unverified: 0
re_verification: false
---

# Phase 152: Comment & Naming Hygiene Sweep — Verification Report

**Phase Goal:** A reader of any file in `packages/**`, `apps/**` or `tests/**` meets comments that
explain the code in front of them, and nothing else — no forced line breaks, no history, no
planning references — held shut by a committed scan wired into `yarn lint:check`.

**Verified:** 2026-08-29T06:45 UTC, independently, against the codebase at HEAD (`fee77f596`),
not against SUMMARY.md prose. Base commit for all "byte-identical" and diff claims:
`d206dc31a` (the commit before this phase's first task commit).

**Status: PASSED — with honestly-recorded open items.** This is the expected shape for this
phase per its own design: it deliberately closed with `REVIEW-HYG-01` and `REVIEW-HYG-02` left
`Pending`, `hygiene-grep-report.sh --assert-clean` red, and three operator questions fenced
rather than resolved. I re-derived and re-ran the phase's own evidence independently everywhere
practical, and found the phase's self-report accurate — with one small addendum noted below
that the phase itself did not catch, and which strengthens rather than undermines its own thesis
that the gate is not a completeness test.

---

## Goal Achievement — Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The forced-line-break + escape guard is live, wired into `lint:check`, and returns zero over its declared 11-extension surface | ✓ VERIFIED | `node scripts/assert-comment-hygiene.mjs` → `files scanned: 1564; rules live: 2 of 2 …; 0 violation(s).` exit 0, independently re-run |
| 2 | The guard's chain membership is a blocking, asserted link of `yarn lint:check` | ✓ VERIFIED | `package.json:lint:check` ends `&& yarn assert:comment-hygiene`; `yarn lint:check` independently re-run, exit 0, guard output present in the tail; `ciTypecheckGate.test.ts` asserts membership (570/570 passing, independently re-run) |
| 3 | Rule 2's predicate is the HARDENED nine-constant form lifted from the sweep instrument, not the naive one, and the two copies do not diverge | ✓ VERIFIED | `diff` of the nine constant declarations (`BANNER_RULE`, `NEXT_IS_LIST_ITEM`, `NEXT_IS_JSDOC_TAG`, `COMMENT_TABLE`, `HANGING_INDENT`, `INDENTED_CODE_SAMPLE`, `PARAGRAPH_BREAK`, `BLOCK_DELIMITER`, `CODE_FENCE`, `TOOL_DIRECTIVE`) between `scripts/assert-comment-hygiene.mjs` and the phase-local `unwrap-comment-paragraphs.mjs` shows byte-identical regex/predicate bodies (only surrounding doc-comment prose differs) |
| 4 | No opt-out mechanism (flag/ignore-file/allowlist/warn-only) exists in the guard, and no dash-normalization rule exists anywhere | ✓ VERIFIED | `git grep -cE 'IGNORE_FILE\|--ignore\|EXCEPTIONS\|allowlist\|warnOnly\|WARN_ONLY' -- scripts/assert-comment-hygiene.mjs` → 0; `git grep -nE '\bdash\b' -- scripts/assert-comment-hygiene.mjs` → exit 1, empty (confirms the phase's own claim that git's ERE engine needs `-P` for `\b`); `grep -nE`/`git grep -P` both return exactly the 3 lines, all inside the standing prohibition, none inside a predicate |
| 5 | The three renames landed, with no dangling reference to the old names anywhere in `apps/`, `packages/`, `tests/` | ✓ VERIFIED | `settingsOverlay.svelte.ts`(+`.test.ts`), `helpers.ts`(+`.test.ts`), `quaternaryChoices` (4 uses) all present on disk; `git grep` for `SettingsOverlay.svelte.ts`, `EntityListWithControls.helpers`, `quatenaryChoices` over `apps packages tests` → 0 hits, all three |
| 6 | The UK/US identifier audit reports zero in-scope hits, committed as a result | ✓ VERIFIED | `node .../uk-identifier-audit.mjs` independently re-run → `files scanned: 1521; in-scope hits: 0 occurrence(s) …` `152-SPELLING-AUDIT.md` present |
| 7 | The escape-encoded dash is fixed, and zero HTML entities / literal escapes remain in comments repo-wide | ✓ VERIFIED (carried from 152-01, unperturbed since) | `EntityCardAction.svelte:12` carries the real character; guard rule 1 reports 0 violations at HEAD |
| 8 | The `.css`/`.scss` and Markdown extension-set gaps are DECLINED, not silently swept, and the decision + numbers are recorded at the site of the decision | ✓ VERIFIED | `scripts/assert-comment-hygiene.mjs` `FAMILY_BY_EXT` contains `html` but not `css`/`scss`/`md`; docblock (:106-120) states the exact `.html`-ADDED / `.css`-DECLINED-at-19 disposition; independently confirmed the three named `.css` files (`app.css`, `inter.css`, `apps/docs/src/lib/layouts/prism-vs.css`) exist and carry multi-line comment blocks consistent with rule-2 violations |
| 9 | The reference gate (`hygiene-grep-report.sh --assert-clean`) is genuinely red at close, not engineered green, and every survivor is attributed to a fenced question, a program byte, or a meaningful numeral | ✓ VERIFIED (with one small addendum) | Independently re-run: exit 1, 5 failing rows (`decision-id-bare` 2, `section-anchor` 5, `planning-path` 1, `task-id` 88, `phase-ref` implicitly 0 in this exact re-run's failing set — see note below); the printed remediation text and row shape match the SUMMARY's table. **Addendum:** my own widened independent sweep (outside the 9 gate rows) found 3 further decision-id-shaped survivors (`DEF-133-01`, 2 files) the gate cannot see and that no WINDOWS entry names — see Judgement §1 |
| 10 | The cardinal E2E gate is genuinely 150/150/0/0/0, not narrated | ✓ VERIFIED | Decoded `report.json` from the ZIP payload embedded in the preserved `tests/e2e-runs/152-15-cardinal-gate/index.html` independently (not trusting the SUMMARY's transcription): `{'total': 150, 'expected': 150, 'unexpected': 0, 'flaky': 0, 'skipped': 0, 'ok': True}` |
| 11 | `hooks.server.ts`, `hooks.ts`, `.editorconfig` are byte-identical across the whole phase | ✓ VERIFIED | `git diff d206dc31a HEAD -- <3 files>` → 0 lines; blob hashes identical at both revisions (`b795834…`, `c731173…`, `ec6742a…`) |
| 12 | No `.md` file changed anywhere in the swept trees outside `.planning/`/`.claude/` | ✓ VERIFIED | `git diff --stat d206dc31a HEAD -- '*.md' ':!.planning' ':!.claude'` → empty; specifically confirmed byte-identical for `packages/dev-seed/README.md`, `apps/frontend/static/fonts/README.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`, `apps/supabase/benchmarks/README.md` |
| 13 | `assert-comment-only-diff.mjs` was run with zero `.planning/`-path allow entries anywhere in the phase, and only 152-13 (a deliberate title-rename plan) used `--allow` at all | ✓ VERIFIED | Grep across all 15 PLAN/SUMMARY files for `--allow` usage: every occurrence in plans 02/05/06/09-11 either states "zero allow entries" or documents the trap and its bounded-range fix; only `152-13-SUMMARY.md` reports live `--allow` usage (24 entries, one per rename-table file, flip-tested with 0 allows → 24 violations) |
| 14 | `build`, `test:unit`, `lint:check`, `format:check` are green at HEAD; `db:lint:sql` is pre-existing red, structurally unaffected | ✓ VERIFIED | Independently re-ran all four: `yarn build` → 14/14 cached, FULL TURBO; `yarn workspace @openvaa/dev-seed test:unit` → 570/570; `yarn workspace @openvaa/frontend test:unit` → 816/816 (54 files); `yarn lint:check` → 22/22 cached, guard output shows `0 violation(s)`; `yarn format:check` → clean; `yarn db:lint:sql` → exit 1, the exact three functions/warnings the phase names (`is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables`), none touching a file this phase edited |

**Score:** 14/14 truths independently re-verified as claimed. No fabricated evidence found anywhere I checked.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/assert-comment-hygiene.mjs` | Standing guard, 2 rules, wired live | ✓ VERIFIED | 594+ lines, both rules present, docblock records the extension-gap decision at the site |
| `.planning/phases/152-.../scripts/hygiene-codemod.mjs` | Phase-local retargeted codemod, importable | ✓ VERIFIED | present, `IS_MAIN` fence confirmed |
| `.planning/phases/152-.../scripts/hygiene-grep-report.sh` | Retargeted gate, reads `occ` not `bare` | ✓ VERIFIED | present, independently re-run, exit 1, 5 rows failing |
| `.planning/phases/152-.../scripts/uk-identifier-audit.mjs` | Committed audit | ✓ VERIFIED | present, independently re-run, 0 hits |
| `.planning/phases/152-.../scripts/assert-comment-only-diff.mjs` | Comment-only-diff prover | ✓ VERIFIED | present, referenced/run by every plan's SUMMARY with recorded output |
| `.planning/phases/152-.../scripts/unwrap-comment-paragraphs.mjs` | D-A4 line-break instrument, 9 constants | ✓ VERIFIED | present, constants confirmed identical to the guard's rule-2 lift |
| `152-GUARD-CONTROLS.md` | Both flips + requirement proof table | ✓ VERIFIED | present, 357 lines per SUMMARY's Self-Check, spot-checked content matches SUMMARY quotations |
| `152-SPELLING-AUDIT.md` | Committed audit result | ✓ VERIFIED | present |
| `.planning/todos/pending/2026-08-28-main-yaml-lint-check-last-link-doc-drift.md` | Filed drift item | ✓ VERIFIED | present |
| `152-BASELINE.md`, `152-RESIDUE-REGISTER.md`, `152-TITLE-RENAMES.md` | Phase working documents | ✓ VERIFIED | all present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `scripts/assert-comment-hygiene.mjs` | `package.json` `lint:check` | `&&` chain, 7th link | ✓ WIRED | confirmed by direct read of `package.json`, re-ran `yarn lint:check` and observed the guard's own summary line in the tail output |
| `scripts/assert-comment-hygiene.mjs` rule 2 | `.../unwrap-comment-paragraphs.mjs` | lift, docblock states non-divergence | ✓ WIRED | 9-constant diff shows identical predicate bodies |
| `ciTypecheckGate.test.ts` | `package.json` `lint:check` array | membership assertion | ✓ WIRED | independently re-ran `yarn workspace @openvaa/dev-seed test:unit` → 570/570 passing, including the 5 `ciTypecheckGate.test.ts` assertions |
| `152-15-SUMMARY.md`'s claimed cardinal-gate numbers | `tests/e2e-runs/152-15-cardinal-gate/index.html` | embedded `report.json` | ✓ WIRED | independently decoded the base64 zip payload and parsed the real JSON — did not trust the SUMMARY's transcription |

---

## Requirements Coverage

| Requirement | Status in REQUIREMENTS.md | Independently confirmed? | Evidence |
|---|---|---|---|
| REVIEW-HYG-01 | Pending (deliberately) | ✓ Confirmed correctly Pending | 19 forced line breaks genuinely survive in `apps/**/*.css` (guard's `FAMILY_BY_EXT` excludes `css`; docblock names the exact 3 files and 19-violation count) — the requirement's literal wording ("no comment in `packages/**`, `apps/**` or `tests/**`...") is not scoped to a family subset, so it is correctly unmet as worded |
| REVIEW-HYG-02 | Pending (deliberately) | ✓ Confirmed correctly Pending | reference gate independently re-run, exit 1, 5 rows failing; every survivor traced to a fenced question (D6/D7), a program byte, or a meaningful numeral per the phase's own attribution table — plus one small class the phase did not itself register (see Judgement §1) |
| REVIEW-HYG-03 | Complete | ✓ Confirmed | all three renames present, zero dangling references, `build`/`test:unit`/`lint:check` all independently green |
| REVIEW-HYG-04 | Complete | ✓ Confirmed | audit re-run, 0 in-scope hits, `152-SPELLING-AUDIT.md` committed |

No orphaned requirements — all four `REVIEW-HYG-*` ids are declared by phase plans and all four are traced in `REQUIREMENTS.md`.

---

## Anti-Patterns Found

None that the phase did not already flag itself. No `TODO`/`FIXME`/`XXX` debt markers were introduced by this phase's own scripts (`scripts/assert-comment-hygiene.mjs` and the phase-local instruments) — checked directly. No disabled/warn-only/flag-gated code path exists for either guard rule. The one `TBD`/`FIXME`-shaped pattern I looked for (a stub return, a hardcoded empty value standing in for real enforcement) is absent: the guard's rule 2 branch is live code, not a stub, confirmed by the flip test reproducing a real `exit 1` on a reintroduced violation (documented in `152-GUARD-CONTROLS.md`, consistent with the guard's actual behavior when I independently ran `--self-test`).

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Guard scans tree and reports zero | `node scripts/assert-comment-hygiene.mjs` | `files scanned: 1564; rules live: 2 of 2 …; 0 violation(s).` exit 0 | ✓ PASS |
| Guard self-test | `node scripts/assert-comment-hygiene.mjs --self-test` | `Fixtures: 6 / Edge cases: 27 / Failures: 0`, exit 0 | ✓ PASS |
| Guard chain membership | `node -e "…lint:check includes assert:comment-hygiene…"` | present, position 7 | ✓ PASS |
| `git grep -nE '\bdash\b'` vacuity claim | `git grep -nE '\bdash\b' -- scripts/assert-comment-hygiene.mjs` | exit 1, empty | ✓ PASS (confirms the phase's own documented ERE-engine caveat) |
| Reference gate genuinely red | `bash hygiene-grep-report.sh --assert-clean` | exit 1 (captured via `$?` directly, not through a pipe) | ✓ PASS |
| UK/US audit | `node uk-identifier-audit.mjs` | 0 in-scope hits over 1,521 files | ✓ PASS |
| `.css` extension declined, not silently added | grep `FAMILY_BY_EXT` in guard source | `css`/`scss` absent, `html` present | ✓ PASS |
| Cardinal E2E gate | decode `report.json` from preserved HTML report | `{total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}` | ✓ PASS |
| `yarn build` | `yarn build` | 14/14 cached, exit 0 | ✓ PASS |
| `yarn lint:check` | `yarn lint:check` | 22/22 cached, exit 0 | ✓ PASS |
| `yarn format:check` | `yarn format:check` | clean, exit 0 | ✓ PASS |
| dev-seed unit tests | `yarn workspace @openvaa/dev-seed test:unit` | 570/570 passed | ✓ PASS |
| frontend unit tests | `yarn workspace @openvaa/frontend test:unit` | 816/816 passed (54 files) | ✓ PASS |
| `yarn db:lint:sql` pre-existing red | `yarn db:lint:sql` | exit 1, same 3 named PL/pgSQL warnings, no file this phase touched | ✓ PASS (expected red, not a regression) |

All spot-checks ran directly against the live repository; none relied on trusting a SUMMARY's transcription of a command's output.

---

## Judgement

### 1. Did the phase achieve its goal, or a green gate? Independent estimate of residual references.

The phase achieved its goal **on the surface it defines and defends**, and it explicitly does
**not** claim the surface is total — that is the correct call, not a shortfall dressed up as
honesty. I ran my own independent widened sweep (not the phase's registered patterns, a
separately-constructed regex set) over `apps/`, `packages/`, `tests/` for phase/plan-shaped and
decision-id-shaped citations, restricted to comment-opening lines to avoid false positives from
things like `RSA-OAEP-256`:

```
git grep -InP '^\s*(//|#|\*|/\*)' -- apps packages tests \
  | grep -viE '\.md:' | grep -viE 'RSA-OAEP|A256GCM|RS256' \
  | grep -P '\b[A-Z]{3,}-\d{2,3}\b'
```

Result: **3 lines, 2 files** (`tests/tests/helpers/navigation.ts:185`,
`tests/tests/utils/voterIntro.ts:8,23`) — every one carrying `DEF-133-01`, a Phase-133
defect-tracking id used as the *name* of a documented design carve-out ("Rigidity carve-out
(DEF-133-01): …"), not as bare "see phase N" narrative. This is the same shape the phase itself
sanctioned and deliberately kept in multiple other places — `WR-05`, `CR-01`, `T-58-07-02`
(WINDOWS 83, WINDOWS 121) — vocabulary that names a real, still-load-bearing design decision
rather than a citation to a planning document. It fits an already-established, defensible
pattern; it is simply a site the phase's own residue register never explicitly enumerated.

A second widened sweep over `phase[- ]?[0-9]{2,3}|plan[- ]?[0-9]{2,3}-[0-9]{2}|D-[0-9]{2}|DEF-[0-9]{3}|see phase|see plan|per phase`
across the same trees returned exactly the 11 already-known Markdown-only hits (all four
registered README/RUNBOOK files, all byte-identical) plus nothing new in `.ts`/`.svelte`/`.sql`.

**My independent estimate: the residual planning-reference surface in `packages/**`, `apps/**`,
`tests/**` outside the phase's own fenced/attributed 117 is on the order of single digits — I
found 3 lines in 2 files, both defensible under the phase's own established convention.** That
is consistent with, not contradictory to, the phase's stated position that its gate is 27-72%
blind by construction but that agreement between the gate and a register is not evidence of
completeness. My finding is exactly the kind of thing that thesis predicts, at a very small
scale after fifteen plans of deliberate, partition-by-partition widened sweeping. **This is not
scored as a gap** — it is recorded here as a genuine (if minor) addendum the phase itself did
not catch, worth a WINDOWS entry, not worth reopening the phase for.

### 2. Is the standing guard actually keepable?

Yes, on the evidence available. I ran `--self-test` (6 fixtures + 27 edge cases, all green) and
independently confirmed the nine rule-2 exclusion constants are named, not implicit — a future
commit adding a JSDoc tag list, a comment table, or a fenced `@example` block is specifically
exempted by `NEXT_IS_JSDOC_TAG`, `COMMENT_TABLE`, and `CODE_FENCE` respectively, all present and
matched in both the guard and the source instrument. I did not construct a synthetic "ordinary
future commit" test beyond re-running `--self-test`, which already exercises these exclusions
positively and negatively across all six fixture families — that is adequate evidence the guard
does not naively redden on the classes it names.

### 3. Was 152-14's hardening faithful to the operator's ruling?

Yes. I independently diffed the nine constant declarations between the standing guard and the
phase-local instrument and found the regex/predicate bodies byte-identical (only doc-comment
prose differs, and the extra prose in the instrument explicitly states "It is therefore a
WIDENING of an existing ruled category, not a sixth one — the ruling's five categories are
unchanged in number and in meaning," which is an accurate self-description of what the diff
shows). The five original ruled exclusions (`BANNER_RULE`, `NEXT_IS_LIST_ITEM`,
`NEXT_IS_JSDOC_TAG`, `COMMENT_TABLE`, `HANGING_INDENT`) remain five; `INDENTED_CODE_SAMPLE`,
`CODE_FENCE`, and `TOOL_DIRECTIVE` are additions the phase itself frames as widenings/
preconditions rather than new named exclusion categories, and `PARAGRAPH_BREAK` is Amendment 1,
which the ruling itself states is "not a behaviour change" but a promotion of an already-present
implementation detail. No sixth category was smuggled in under a widening's name.

---

## Human Verification Required

None. Every item this phase left open is a **fenced operator decision by design** (D6: do the 23
E2E coverage ids stay in test titles; D7: does the Markdown convention extend to comment hygiene,
under which prover; the `.css`/`.scss` sweep), not a verification gap. The operator is away
overnight per instruction, and nothing here requires an interactive checkpoint — the three
questions are already fully recorded in `152-15-SUMMARY.md`'s closing section and in WINDOWS
128/129/131, and reproduced faithfully in this report above.

---

## Gaps Summary

No blocking gaps. The phase's own two `Pending` requirements (`REVIEW-HYG-01`, `REVIEW-HYG-02`)
are correctly `Pending` under their literal wording — verified independently, not merely
transcribed from the SUMMARY — and the phase's decision not to force-mark them is the correct
decision, consistent with `.planning/REQUIREMENTS.md`'s own state. The single addendum found
during independent verification (`DEF-133-01`, 2 files) is too small and too consistent with an
already-sanctioned pattern to constitute a gap; it is recorded above as a finding worth a
one-line WINDOWS entry, not a reason to withhold PASSED.

---

_Verified: 2026-08-29T06:45 UTC_
_Verifier: Claude (gsd-verifier)_
