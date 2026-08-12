---
status: resolved
trigger: "A11y E2E flake (CARDINAL no-flaky): a11y-smoke.spec.ts axe color-contrast violation on elections-selector labels. fgColor #858585 on #ffffff = 3.69:1 (#666 token at ~0.8 ancestor opacity). SCAN-TIMING readiness defect — scan fires while entrance fade is ~80% complete. Two prior fixes (await Web Animations + quiescence loop) PROVEN INSUFFICIENT because a data-driven late render re-triggers the fade after the settle gate exits."
created: 2026-06-22T00:00:00Z
updated: 2026-08-12T00:00:00Z
resolution: "RESOLVED 2026-08-12 at v2.14 close. This session's premise is OBSOLETE, not merely superseded. It records the ElectionSelector .label contrast failure as LIVE (settled scans 12/12 FAIL) — but that app-side defect was already closed by commit 0eb27c677 on 2026-06-22 19:59, hours after this session was written, and Phase 134 RE-MEASURED the elections selector under a settled DOM at 0 color-contrast violations in BOTH light and dark. The v2.14 milestone audit carries the same correction ([CORRECTED 2026-08-10]). What was genuinely real here — that the suite could not have caught the defect — was closed by Phase 134 FIX-01: a required data-driven content anchor per axe scan route, so a route cannot be added without declaring what loaded means. No open work remains."
---

## Current Focus

status: CHECKPOINT. Root cause CONFIRMED to be a REAL app contrast bug, not a phantom. Spec reverted to HEAD baseline. No test-infra fix can resolve it.
hypothesis: DISPROVEN bug-report premise / CONFIRMED true cause — the #858585 is the election option label span's OWN text color (oklab #333 / 0.6 alpha) from DaisyUI .label `color-mix(in oklab, currentcolor 60%, transparent)`, inherited via ElectionSelector.svelte:56/69. opacity=1, no fade, no VT, no animation. Settled scans FAIL 12/12. opacity-force injection does not change the color or the verdict. This is a genuine WCAG 2.1 AA violation; the suite is mostly green only because the labels intermittently miss the scan window.
test: completed — ground-truth capture (8/8 color /0.6), settled axe (12/12 fail), source confirmed (DaisyUI .label).
next_action: STOP. Return CHECKPOINT with the real mechanism + the required app-scope fix direction. Do NOT apply a test-infra mask (would violate no-masking + WCAG discipline). App fix: give the option span explicit full-opacity text color OR drop the `.label` wrapper class for primary content (audit constituencies-selector too).

## Symptoms

expected: a11y-smoke axe scans run against SETTLED (full-opacity) DOM → 0 color-contrast violations, deterministically, regardless of fade timing.
actual: intermittent color-contrast failure. `<span>[el-reg] Regional Election</span>` reports fgColor #858585 on #ffffff = 3.69:1 (needs 4.5:1). #858585 ≈ #666 composited through ~0.8 ANCESTOR opacity. Scan fires while entrance fade is ~80% complete.
errors: "color-contrast" axe violation; fg #858585 on #ffffff 3.69:1
reproduction: yarn dev on :5173. npx playwright test a11y-smoke.spec.ts -g "elections-selector" --repeat-each=40 --workers=1 --retries=0
started: residual flake post-perm-fix; two prior fixes insufficient.

## Eliminated

- hypothesis: "Awaiting all finite Web Animations to .finished settles the page before scan"
  evidence: PROVEN INSUFFICIENT twice. (1) Original single-shot getAnimations finite .finished reduced but did not kill flake. (2) Quiescence loop (2 consecutive empty frames, bounded 30) → still 3 failed / 219 passed at --repeat-each=20 --retries=0. A data-driven late render can start/re-trigger the fade AFTER the settle gate exits.
  timestamp: 2026-06-22

## Evidence

- timestamp: 2026-06-22 (diagnostic: opacity mechanism at heading-visible)
  checked: page.goto(/en/elections), wait heading visible, evaluate getAnimations + opacity chain
  found: At heading-visible, animCount=0 AND the election-selector label span DOES NOT EXIST YET ("(no span)"). The labels are DATA-DRIVEN and render AFTER the heading.
  implication: The settle gate fires (heading visible) before the labels even exist — there is nothing to await at that point. Confirms the bug report's "data-driven late render" insight.

- timestamp: 2026-06-22 (diagnostic: full opacity timeline, seeded, 3 runs)
  checked: poll span opacity + getAnimations every rAF for ~180 frames after heading-visible
  found: t≈235-260ms a finite DIV CSSTransition starts; t≈286-320ms the label span appears with computed opacity=1 and ALL ancestors opacity=1; t≈415-436ms 0 anims. NEVER observed opacity<1 on the span or any ancestor in normal isolated runs.
  implication: In the normal (non-pressured) path there is NO opacity fade visible to getComputedStyle OR getAnimations. The flake is render-pressure-dependent and sub-frame.

- timestamp: 2026-06-22 (diagnostic: animation IDENTITY)
  checked: capture constructor.name, cssAnimName, transitionProperty, keyframe props of the single DIV animation
  found: The ONLY Web Animation present is a CSSTransition on `scrollbar-color` (keyframe prop scrollbarColor), target = the video container DIV with class `... transition-all ...` (Layout.svelte:90). It is a RED HERRING — unrelated to opacity. No opacity animation anywhere.
  implication: getAnimations-based settle gates await an irrelevant scrollbar-color transition; they never see (because it does not exist as a WAAPI animation) the opacity transient that produces #858585. This is WHY both prior getAnimations fixes failed.

- timestamp: 2026-06-22 (diagnostic: View Transition + document.getAnimations)
  checked: instrument startViewTransition call count; sample document.getAnimations() (incl ::view-transition pseudos) over time
  found: vtCalls=0 (raw page.goto is a FULL navigation, never triggers the client-side onNavigate startViewTransition). document.getAnimations() shows ONLY the scrollbar-color CSSTransition; NO ::view-transition pseudo animation, NO opacity animation. Everything settled by t≈436ms.
  implication: The entrance fade on the UNLOCATED routes is NOT a View Transition. The app's VT cross-fade only fires on client-side nav, which a11y-smoke's raw page.goto does not do. The #858585 composite must be a sub-frame hydration/render transient not captured by either getAnimations API.

- timestamp: 2026-06-22 (repro: elections-selector --repeat-each=40 --workers=1, CURRENT uncommitted code)
  checked: npx playwright test -g "elections-selector" --repeat-each=40 --workers=1 --retries=0
  found: 82 passed / 0 failed. Flake did NOT reproduce at workers=1 isolated to the one route.
  implication: At workers=1 with a single route the flake is not triggered — consistent with the prior debug doc's "no parallel pressure = 0 violations". Must reproduce via the FULL file repeat (back-to-back test churn) to create the render pressure that widens the transient.

- timestamp: 2026-06-22 (baseline workers=1 full-file repeat-each=20)
  checked: HEAD baseline + quiescence-loop variant, full file --repeat-each=20 --workers=1 --retries=0
  found: 222 passed / 0 failed (13.8m). Flake did NOT reproduce at workers=1 even over 220 runs.
  implication: The flake is PARALLEL-PRESSURE dependent — workers=1 does not create the render contention that widens the sub-frame opacity transient. The original bug-report "3 failed / 219 passed" was a parallel-workers run. Must reproduce under --workers>1 to confirm the failure, then prove the fix under BOTH parallel pressure AND the mandated workers=1 high-iteration gate.

- timestamp: 2026-06-22 (FIX mechanism functional proof — _diag-force.spec.ts)
  checked: inject a span at opacity:0.2 (the flake condition) + a .faded span + an [aria-hidden] span, then apply the fix's scan-only stylesheet, read computed opacity
  found: contentOpacity=1 (forced), fadedOpacity=0.3 (spared), ariaHiddenOpacity=0.2 (spared). 3 passed.
  implication: The fix DETERMINISTICALLY forces a faded CONTENT element to full opacity (closing the flake) WHILE leaving intentional-fade markers (.faded, [aria-hidden], opacity-0, [inert]) dimmed — so it cannot create a NEW phantom violation by un-hiding decorative/intentionally-dimmed content. The !important page-lifetime injection also survives the late data-driven label re-render that defeated the await-based gates.

- timestamp: 2026-06-22 (DISPROOF — fix v1 forceSettledOpacityForScan FAILED Gate 2)
  checked: full file --repeat-each=20 --workers=1 --retries=0 WITH the opacity-force injection
  found: 1 FAILED / 221 passed (14.1m). SAME signature: <span>[el-reg] Regional Election</span> / [el-mun] fg #858585 on #ffffff 3.69:1, relatedNodes <div class="drawer bg-base-100">. The flake reproduced AT workers=1 over the full file ×20 (contradicting the earlier 222/0 baseline run — it IS reproducible at workers=1, just low-probability ~1/220).
  implication: The opacity-force injection did NOT fix it. Either (a) the #858585 is NOT produced by an ancestor opacity my selector overrides, or (b) the label RE-RENDERS after the injection+rAF and axe scans a transient my !important rule somehow loses to, or (c) #858585 is a REAL computed color (color-mix / token transient), not an opacity composite. MUST capture the failing element's ACTUAL computed color + opacity chain AT the moment axe sees #858585 — instrument inside the scan path. The "ancestor ~0.8 opacity" theory in the bug report may be WRONG; #666@0.8/white=#858585 is arithmetically consistent but so is a direct #858585 token.

- timestamp: 2026-06-22 (GROUND TRUTH — captured the offender's real computed color, _diag-capture.spec.ts)
  checked: scan /en/elections immediately after heading (NO opacity force), dump the offending span's computed color + opacity + ancestor chain the instant axe reports #858585. Caught it 8/8 times across 25-iter loops.
  found: spanColor = `oklab(0.32109 ... / 0.6)` (= base-content #333 at 0.6 ALPHA), spanOpacity = "1", injectedStyleTags = 0, NO animations. The #858585 is NOT an ancestor-opacity composite — it is the span's OWN text color carrying a 0.6 alpha channel.
  implication: The bug report's premise is WRONG. There is no entrance fade, no ancestor opacity, no scan-timing transient. The text COLOR itself is semi-transparent (60% alpha). Every opacity/animation-based fix is structurally incapable of touching it because the transparency is in `color`, not `opacity`.

- timestamp: 2026-06-22 (PERSISTENCE — settled-state axe, _diag-settled.spec.ts)
  checked: hard-settle (networkidle + 1.5s) then run REAL axe on /en/elections, 12 iterations
  found: 0 pass / 12 FAIL. Span color stably `oklab(#333 / 0.6)` across 6 reloads. fg #858585 = 3.69:1 EVERY time. Applying the forceSettledOpacityForScan injection does NOT change the color (still /0.6) and does NOT change the verdict (still FAIL).
  implication: This is a PERSISTENT, DETERMINISTIC WCAG 2.1 AA color-contrast violation — NOT a flake, NOT timing. When the election option labels are present and scanned, they ALWAYS fail. The opacity-force fix cannot mask it (proven).

- timestamp: 2026-06-22 (SOURCE — DaisyUI .label color-mix)
  checked: node_modules/daisyui/daisyui.css .label rule + ElectionSelector.svelte
  found: DaisyUI 5.5.13 `.label { color: color-mix(in oklab, currentcolor 60%, transparent) }`. ElectionSelector.svelte:56 wraps each option in `<label class="label ...">`, and the option text `<span>` (line 69) has NO explicit color class — it INHERITS the .label muted color. currentcolor = base-content #333 → mixed to 60% → effective #858585 on white = 3.69:1 < 4.5:1 AA.
  implication: ROOT CAUSE = a REAL app contrast bug. The DaisyUI `.label` class is being used as a generic clickable-row wrapper for the election checkbox + its primary content text, but `.label` is intended for muted form-field labels and dims its text to 60% — inappropriate for primary selectable content. Fix requires APP CSS (give the option `<span>` an explicit full-opacity `text-base-content`/`text-secondary`-without-mute color, or stop using `.label` as the wrapper). This is OUT OF the mandated test-infra-only scope.

- timestamp: 2026-06-22 (FLAKE MECHANISM — why it's intermittent not 100%)
  checked: buildRoute('Elections','en') => '/elections' (the test always hits the NO-locale route). Probed /elections 15× with the test's settle+forceSettled+scan.
  found: h1 always "Select an election" (selector shown, no redirect). axe color-contrast FAILED 13/15. The pass cases are runs where the 2 option-label spans had not yet rendered into the snapshot axe captured (a pure render-timing race on label PRESENCE, not on color). When present (the common case after the 2-rAF settle), they ALWAYS fail.
  implication: The "flake" is really a near-deterministic REAL violation that only intermittently escapes detection when the labels haven't rendered at the scan instant. The bug-report framing ("phantom, scan-timing, not a real contrast bug, don't change colors") inverts reality: it IS a real contrast bug, and the only reason the suite is mostly green is the labels frequently miss the scan window.

## Resolution

root_cause: |
  REAL, PERSISTENT WCAG 2.1 AA color-contrast violation (NOT a scan-timing phantom,
  NOT an opacity/fade transient — the bug-report premise is disproven by ground-truth
  capture). The election-selector option label text is rendered with
  `color: color-mix(in oklab, currentcolor 60%, transparent)` — DaisyUI 5.5.13's
  `.label` component rule. ElectionSelector.svelte:56 wraps each option in
  `<label class="label ...">` and the option `<span>` (line 69) inherits that muted
  color. base-content #333 mixed to 60% alpha = effective #858585 on white = 3.69:1,
  below the 4.5:1 AA threshold. The text's own `color` carries the 0.6 alpha; element
  `opacity` is 1 and there is no ancestor opacity, no fade, no View Transition
  (startViewTransition count = 0 on the raw page.goto), and the only Web Animation on
  the route is an irrelevant scrollbar-color CSSTransition. Settled scans fail 12/12.
  The suite is only mostly-green because the 2 option-label spans intermittently miss
  the axe scan window (a render-PRESENCE timing race), not because the contrast is
  ever actually adequate.
  WHY ALL THREE PRIOR/ATTEMPTED FIXES FAILED: all targeted OPACITY / animation
  settling (getAnimations finite .finished; quiescence loop; and this session's
  forceSettledOpacityForScan opacity-force injection). The transparency is in the
  COLOR channel, not opacity — proven: injecting opacity:1!important leaves the span
  color /0.6 and the scan still FAILS. No opacity- or animation-based gate can fix a
  semi-transparent text COLOR.
fix: |
  NOT APPLIED — requires an APP change, which is OUT OF the mandated test-infra-only
  scope (the bug constraints forbid touching app/production code or colours, and
  instruct: STOP with CHECKPOINT if the only robust fix needs app changes).
  The correct app fix (for a follow-up app-scope phase): give the election option
  `<span>` (ElectionSelector.svelte:69) an explicit full-opacity text colour
  (e.g. wrap text in `text-base-content` / a non-muted token) OR stop using DaisyUI
  `.label` as the clickable-row wrapper for primary selectable content (use a plain
  `<label>` without the `.label` class, keeping `cursor-pointer gap-sm` utilities),
  so the option text clears 4.5:1. The SAME pattern likely affects
  constituencies-selector (also uses `.label`-wrapped options) — audit both.
  A test-infra-only "fix" (forcing opacity, masking the violation, or relaxing the
  axe gate) would either NOT work (proven) or would VIOLATE the no-masking constraint
  + the CLAUDE.md WCAG 2.1 AA discipline by hiding a real accessibility defect.
verification: |
  Ground-truth capture (8/8): offending span color = oklab(#333 / 0.6), opacity 1, 0 animations, injectedStyleTags 0.
  Settled axe (12/12 FAIL): persistent #858585 3.69:1, stable across reloads; opacity-force injection does not change color or verdict.
  Source confirmed: DaisyUI 5.5.13 `.label { color: color-mix(in oklab, currentcolor 60%, transparent) }` inherited by ElectionSelector.svelte:69 span.
  forceSettledOpacityForScan opacity-force fix DISPROVEN: Gate 2 full-file ×20 = 1 failed / 221 passed; settled-state injection diagnostic = still FAIL. Spec reverted to committed HEAD baseline.
status: CHECKPOINT — real app contrast bug, fix is out of test-infra scope.
files_changed: []
