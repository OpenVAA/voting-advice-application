---
created: 2026-08-12
source: Phase 136 D-136-05-2; queued for next milestone at v2.14 close
resolves_phase: 146
severity: medium
area: E2E / build reliability
---

# The now-blocking visual gate depends on network egress to fonts.googleapis.com

## The dependency

`staticSettings.font.url` loads Inter from Google Fonts with `display=swap`. Every visual-regression
run therefore needs public network access to render the font the baselines were captured with. Since
Phase 136 the `e2e-visual` job is **blocking** (`continue-on-error` removed), so this is now a
third-party network dependency sitting inside a build-reddening gate — an availability risk the
project does not control.

## What is already mitigated

`settleFonts` asserts the app's own font actually loaded, so a runner that cannot reach
`fonts.googleapis.com` fails as an explicit **"Inter did not load"** rather than as an inscrutable
whole-page pixel diff. That is a real improvement — the failure is legible — but it is a better
error message, not independence.

## The actual fix

**Self-host the font**: vendor a woff2 into the app and serve it from the same origin. Removes the
network from the gate entirely, and incidentally removes a third-party request from the production
app (a privacy and latency win independent of testing).

Requires a re-baseline, because self-hosted Inter may rasterise differently from the Google-served
build. Re-baseline in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64` — never
on a developer Mac (that mismatch is what left the project non-functional between v1.2 and Phase
136). Note also D-136-06-2: the local container recipe needs the dev server bound `--host 0.0.0.0`,
not loopback.

## Worth pairing with

`.planning/todos/pending/2026-08-12-visual-gate-ratio-blind-to-tall-pages.md` — the sensitivity-floor
finding. Both are visual-gate work and both require a re-baseline, so doing them together costs one
re-baseline instead of two.

## Related

- `136-VISUAL-DISCRIMINATION-EVIDENCE.md` — the gate is proven to discriminate; these are its
  remaining reliability/sensitivity caveats
- D-136-05-2 in `.planning/phases/136-*/deferred-items.md`
