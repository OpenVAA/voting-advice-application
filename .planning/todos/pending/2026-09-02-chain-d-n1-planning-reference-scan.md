# Chain D-N1's planning-reference scan into `lint:check`

**Filed:** 2026-09-02, from Phase 158's gate (158-09)
**Severity:** medium — a convention with no standing enforcement decays silently

## The measurement

Phase 158 required D-N1 of every comment its plans wrote or rewrote: **no planning-artifact
path, no phase or plan number, no decision id** in source comments. The gate re-measured how
that convention is actually enforced and found it is not.

`yarn assert:comment-hygiene`, re-run at 2026-09-02:

```
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1628;
vendored files excluded by name: 2; rules live: 2 of 2
(unicode-escape-in-comment; forced-line-break). 0 violation(s).
```

Both live rules are about comment *formatting*. **Neither enforces D-N1.** The script also
carries a standing prohibition on dash rules, so D-N1 cannot simply be added as a third rule
without revisiting that.

D-N1's only enforcement during Phase 158 was a **per-plan diff scan** — each executor checking
its own changed lines. That scan is chained into nothing, so it stops existing the moment the
phase ends.

Chain membership at time of filing is **eleven** assertion scripts (Phase 158 added two,
`assert:cookie-names` and `assert:no-session-in-loads`):

```
assert:i18n-catalog-namespaces  assert:a11y-scan-wiring   assert:comment-hygiene
assert:edge-env-defaults        assert:declared-binaries  assert:node-engine
assert:env-pair-registry        assert:schema-migration-parity
assert:adapter-casts            assert:cookie-names       assert:no-session-in-loads
```

Note the plan text that described this chain said "nine" and said no comment scan was chained;
both are wrong at HEAD. Measure before relying on either figure.

## Why it was not done inside Phase 158

Deliberate operator decision at the phase gate. Chaining a new repo-wide guard is real work
with its own false-positive risk, and bolting it on *after* the E2E suite had already been
certified cardinal-clean at that HEAD would have invalidated the certification it was added
under. Recorded rather than rushed.

## What closing this looks like

1. Decide where D-N1 lives — a third rule inside `assert-comment-hygiene.mjs` (requires
   revisiting its dash-rule prohibition) or its own `assert-no-planning-refs-in-source.mjs`
   alongside `assert-cookie-names.mjs`, whose fixture-driven shape is the closest analog.
2. Expect it to red on **pre-existing** code outside Phase 158's touched files. Budget for a
   census and a decision — fix, or an explicit grandfather list annotated the way
   `eslint.config.mjs`'s allowlist is.
3. Prove it fires with a planted violation, observed red then restored, before recording it as
   working. A guard that matches nothing passes silently.
4. Chain it into `lint:check` and record the new membership count.

## Cross-references

- Phase 158 gate: `.planning/phases/158-routing-auth-surface-harmonisation/158-09-SUMMARY.md`
- Closest analog for a fixture-driven chained guard: `scripts/assert-cookie-names.mjs`
  (Phase 158 plan 03), `scripts/assert-no-session-in-loads.mjs` (plan 13)
- Related standing lesson from the same phase: a guard each plan may opt out of is not a
  standing guard — `yarn format:check` was red at the gate for exactly that reason.
