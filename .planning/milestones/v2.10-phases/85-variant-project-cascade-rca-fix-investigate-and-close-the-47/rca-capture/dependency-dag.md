# Variant Linear Chain — Dependency DAG

**Source:** `tests/playwright.config.ts:225-391` (verbatim read 2026-05-14).
**Purpose:** Prove the variant cascade is **single-source**, not 9-source, by tracing
the linear dependency chain from `data-setup-multi-election` (chain head) through to
`variant-hidden-required-candidate` (chain tail).

## Cascade Propagation Rule

Playwright's `dependencies: [...]` array is a **strict-cascade contract**: if ANY
project in a dependency chain emits a `failed` test, every transitively dependent
project's tests emit `status: 'skipped'` with empty error. This is documented at
[https://playwright.dev/docs/test-projects#dependencies](https://playwright.dev/docs/test-projects#dependencies)
and is the mechanism by which a single FAIL at the chain head produces 44 CASCADE-SKIP
entries downstream.

## Chain Head

The variant linear chain's root project, `data-setup-multi-election`, declares its
dependencies at **`tests/playwright.config.ts:236`**:

```ts
{
  name: 'data-setup-multi-election',
  testMatch: /variant-multi-election\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['candidate-app-password', 'voter-app-popups']
}
```

Per `rca-capture/chain-head-failure.txt`, the `voter-app-popups` project contains a
deterministic FAIL (`should remember dismissal after page reload`, 3/3 across Phase 84
runs). This FAIL cascade-skips `data-setup-multi-election` AND every transitively
dependent project below.

## Linear Chain Trace

```
[upstream root projects — outside variant chain, but cited by chain head]
   candidate-app-password         (line 219, passes)
   voter-app-popups               (line 211, FAILS on "should remember dismissal" 3/3)
      |
      | Playwright strict-cascade contract triggers:
      v
data-setup-multi-election         (line 233; deps: [candidate-app-password, voter-app-popups])
      |
      v
variant-multi-election            (line 239; deps: [data-setup-multi-election])
      |
      v
variant-results-sections          (line 249; deps: [variant-multi-election])
      |
      v
data-setup-constituency           (line 259; deps: [variant-results-sections])
      |
      v
variant-constituency              (line 265; deps: [data-setup-constituency])
      |
      v
data-setup-startfromcg            (line 275; deps: [variant-constituency])
      |
      v
variant-startfromcg               (line 281; deps: [data-setup-startfromcg])
      |
      v
data-setup-low-minimum-answers    (line 291; deps: [variant-startfromcg])
      |
      v
variant-low-minimum-answers       (line 297; deps: [data-setup-low-minimum-answers])
      |
      v
data-setup-1e-Nc                  (line 308; deps: [variant-low-minimum-answers])
      |
      v
variant-1e-Nc                     (line 314; deps: [data-setup-1e-Nc])
      |
      v
data-setup-Ne-Nc                  (line 325; deps: [variant-1e-Nc])
      |
      v
variant-Ne-Nc                     (line 331; deps: [data-setup-Ne-Nc])
      |
      v
data-setup-allowopen              (line 341; deps: [variant-Ne-Nc])
      |
      v
variant-allowopen                 (line 347; deps: [data-setup-allowopen])
      |
      v
data-setup-hidden-required        (line 358; deps: [variant-allowopen])
      |
      v
variant-hidden-required-voter    (line 368; deps: [data-setup-hidden-required])
      |
      v
variant-hidden-required-candidate (line 382; deps: [variant-hidden-required-voter])
                                  ^^^ chain tail
```

## Project Count Audit

| Tier | Projects | Total |
|------|----------|-------|
| Data-setup projects (run the variant template seed) | data-setup-{multi-election, constituency, startfromcg, low-minimum-answers, 1e-Nc, Ne-Nc, allowopen, hidden-required} | 8 |
| Spec projects (run tests against the seeded data) | variant-{multi-election, results-sections, constituency, startfromcg, low-minimum-answers, 1e-Nc, Ne-Nc, allowopen, hidden-required-voter, hidden-required-candidate} | 10 |
| Shared teardown | data-teardown-variants (line 227) | 1 |
| **Total variant-chain projects** | | **19** |

**Note on 8-vs-9 setup files (Rule-1 deviation):** CONTEXT.md + RESEARCH.md describe "9
variant setup files." Empirically there are **8** data-setup-*.setup.ts files. The
discrepancy: `variant-results-sections` is a **spec-only project** that re-uses
`data-setup-multi-election`'s seed (line 254: `dependencies: ['variant-multi-election']`,
no own data-setup). The architectural disproof in `rca-capture/h1-grep.txt` holds across
all 8 (which is the universe relevant for H1).

## Cascade Footprint

With the chain head FAILING:
- **8 data-setup projects** cascade-skip (their setup body never runs).
- **10 spec projects** cascade-skip (no data to test against).
- **2 voter-app-popups dismissal-cascade companions** cascade-skip
  (`should show survey popup after delay on results page`, `should not show any popup when disabled`)
  — these are SIBLINGS of the failed test in the same project, not chain-dependent.
- **5 voter-app browser-back + CLEAN-02 entries** cascade-skip (they depend on
  `auth-setup → voter-app` which is upstream of the variant chain but downstream of
  voter-app-popups in a sibling branch — actually depends on `candidate-app-password` per
  line 211 → 219; these 5 are siblings of voter-app-popups within `voter-app` project).
- **= 44 CASCADE-SKIP entries** total (perfectly matches `cascade-classification.txt`).

The 3 candidate-app-settings PRODUCT-GAP `test.skip()` entries are NOT part of this
cascade — they have non-empty `t.annotations[]` and are intentional source-skips.

## Fix Strategy Implications

**Path B (recommended)** — surgical 1-line decoupling at line 236:

```ts
// Before:
dependencies: ['candidate-app-password', 'voter-app-popups']
// After:
dependencies: ['candidate-app-password']
```

This severs the cascade structurally. The variant linear chain becomes independent of
the `voter-app-popups` test's verdict. Precedent: Phase 84's identical maneuver on
`re-auth-setup → candidate-app-mutation` / `re-auth-setup → candidate-app`
(playwright.config.ts:148-152, commit `93050e4fb`). D-08-compliant: Phase 85 does NOT
touch the popup test itself; Phase 86 DETERM-12 retains ownership of the actual fix.
