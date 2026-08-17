# Phase 63: E2E Template Extension & Greening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-24
**Phase:** 63-e2e-template-extension-greening
**Areas discussed:** Template design (E2E-02), Greening measurement & close criteria (E2E-01), Scope of updateAppSettings migration, Post-v2.6 parity baseline re-anchoring

---

## Gray Area Selection

All 4 areas selected.

---

## Template Design for `app_settings.fixed[]` (E2E-02)

### Q1: Template field shape

| Option | Selected |
|--------|----------|
| `app_settings: { fixed: [{ external_id, value: Partial<AppSettings> }] }` | ✓ |
| `app_settings: Partial<AppSettings>` | |
| `app_settings.fixed: Array<Partial<AppSettings>>` | |

### Q2: Base-plus-overlay merge semantics

| Option | Selected |
|--------|----------|
| Deep merge: variant overrides base on matching keys | ✓ (user note: "there should be a mergeSettings or such utility which should be used. If not importable, either add to the app-shared module or make sure to implement same behaviour and mark this in both places") |
| Array concatenation | |
| Variant replaces base entirely | |

**User note:** Deep-merge requires a `mergeSettings` utility. No such utility exists today (grep verified). Add to `@openvaa/app-shared`. If cross-package import from `@openvaa/dev-seed` is blocked, duplicate with explicit code-level marker pointing to app-shared as source-of-truth; mark both sites.

### Q3: Where variant overlays live

| Option | Selected |
|--------|----------|
| Inline in each variant template file | ✓ |
| BUILT_IN_OVERRIDES map | |
| Hybrid | |

### Q4: Fate of the 4 setup-file calls

| Option | Selected |
|--------|----------|
| Delete all 4 outright after parity verifies | ✓ |
| Keep as commented fallback one release | |
| Delete + explicitly preserve admin-client method | (implicit in option 1) |

---

## Greening Measurement & Close Criteria (E2E-01)

### Q1: Numeric threshold

| Option | Selected |
|--------|----------|
| Pass-set strictly grows per cumulative Phase 60/61/62 contract | ✓ |
| Literal PARITY GATE: PASS | |
| Percentage reduction (≥50%) | |
| Per-test contract | |

### Q2: Residual failure classification

| Option | Selected |
|--------|----------|
| Documented framework-level allowed; others block close | ✓ |
| Zero residuals | |
| Tolerant — any net improvement | |

### Q3: Independent greening work

| Option | Selected |
|--------|----------|
| Measurement + E2E-02 + targeted residual-fix budget (2-3 fixes) | ✓ |
| Measurement + E2E-02 only | |
| Budget-less | |

### Q4: New v2.6 tests vs parity baseline

| Option | Selected |
|--------|----------|
| Additive-neutral per Phase 60 B-3 validation | ✓ |
| Re-embed new tests into PASS_LOCKED at v2.6 close | |
| Decouple phase measurement from re-embed | |

---

## Scope of updateAppSettings Migration

### Q1: Migration scope

| Option | Selected |
|--------|----------|
| Only 4 setup-file calls | |
| 4 setup + executor-classified defensive-baseline spec calls | ✓ |
| Full sweep | |

### Q2: Verification strategy

| Option | Selected |
|--------|----------|
| Post-seed deep-compare assertion | ✓ |
| Parity gate + spot-check | |
| Both | |

### Q3: Admin-client method fate

| Option | Selected |
|--------|----------|
| Keep as-is; JSDoc update | ✓ |
| Flag for deprecation | |
| No statement | |

---

## Post-v2.6 Parity Baseline Re-anchoring

### Q1: Anchor strategy

| Option | Selected |
|--------|----------|
| Re-anchor at v2.6 close to new SHA | ✓ |
| Keep `3c57949c8` forever | |
| Dual anchors | |

### Q2: Ownership of re-anchor mechanics

| Option | Selected |
|--------|----------|
| Phase 63 captures artifact; milestone-close updates constants | ✓ |
| Phase 63 does both | |
| Defer entirely | |

### Q3: Constant regeneration strategy

| Option | Selected |
|--------|----------|
| Regenerate all 3 sets from v2.6 baseline | ✓ |
| Incremental addition | |
| Reset + reclassify | |

### Q4: v2.5 baseline artifact

| Option | Selected |
|--------|----------|
| Keep in place (historical record) | ✓ |
| Move to milestones/v2.5/ archive | |
| Delete | |

---

## Claude's Discretion

- Plan split within Phase 63
- `mergeSettings` utility API shape
- Post-seed deep-compare precision (field tolerance, array ordering)
- Which specific residual fixes (if any) land from the 2-3 fix budget
- Defensive-baseline classification per spec-level call

## Deferred Ideas

- `SupabaseAdminClient.updateAppSettings()` deprecation (future phase)
- Declarative test-scoped settings-mutation DSL (future DX)
- Automated test classification for DATA_RACE detection (future enhancement)
- Milestone-close workflow hardening for re-anchor (tracked separately)
- `mergeSettings` cross-package import unification if initially duplicated (future dep-graph work)
