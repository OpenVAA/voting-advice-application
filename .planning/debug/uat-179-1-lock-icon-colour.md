---
status: diagnosed
trigger: "uat-179-1-lock-icon-colour: The lock icons of closed entries use the disabled neutral color as well."
created: 2026-10-31T17:30:00Z
updated: 2026-10-31T18:05:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic styling)
hypothesis: CONFIRMED. Button.svelte's disabled recolouring sits on the label div only (labelClass, group-disabled/group-aria-disabled:text-neutral/20). The Icon is a sibling of that div and is fill-current, so it inherits the anchor's own text-primary colour.
test: done; computed and drawn colours measured in light and dark, then the classes added to the live svg and re-measured, with an open-row control
expecting: met
next_action: Diagnose-only session. Hand the root cause to the fix planner; no source edit made here

## Symptoms

expected: The lock icons of closed entries use the disabled neutral color as well.
actual: "Use the disabled neutral color for the lock icons as well"
errors: None reported
reproduction: Test 9 in UAT. Sign in at http://localhost:5173/contestant/login (Sign in with email) as uat-nonom@test.openvaa.local, password Password1!, which lands on http://localhost:5173/contestant/candidate/88737a88-eb4a-482a-8072-801fcdbc07ec . The task list's closed rows lead with a lock icon.
started: Discovered during UAT

## Eliminated

- hypothesis: The home page or its entryIcon/rowIcon helpers set the lock's colour
  evidence: They return an icon name only. The rendered svg's classes are Icon's defaults (`inline-block h-24 w-24 min-h-24 min-w-24 fill-current`).
  timestamp: 2026-10-31T17:40:00Z

- hypothesis: daisyUI's disabled button colour should already reach the icon, and an aria-disabled anchor merely misses it
  evidence: A natively disabled clone in the same colour path keeps rgb(37,70,168) and rgb(104,135,227), so the text-primary utility wins over `.btn:disabled` as well. The element type is not the cause.
  timestamp: 2026-10-31T17:50:00Z

## Evidence

- timestamp: 2026-10-31T17:40:00Z
  checked: apps/frontend/src/lib/components/button/Button.svelte, Icon.svelte and the entity home +page.svelte
  found: The home passes the lock as Button's `icon` prop with `disabled` (entryIcon, rowIcon). Button.labelClass puts `group-disabled:text-neutral/20 group-aria-disabled:text-neutral/20 group-[.disabled]:text-neutral/20` on the label div only. `<Icon name={icon} />` is a sibling in a separate `div.relative` with no such class, and Icon's default is `fill-current`, so it takes the colour of the anchor, which carries `text-primary`.
  implication: The icon has no disabled treatment at all in the shared component; nothing on the home page chooses the colour.

- timestamp: 2026-10-31T17:50:00Z
  checked: Live measurement (scratchpad uat-lock.mjs, report lock/report.json), uat-nonom, entity 88737a88, 1280 wide, colorScheme light and dark. Computed style plus the pixels of an element screenshot.
  found: Closed rows profile, questions, preview are `<a aria-disabled="true">` with no href. Lock fill today is the primary, rgb(37,70,168) light and rgb(104,135,227) dark, drawn at 8.33:1 and 6.16:1. Label is oklab(0.32109 ... / 0.2) light and oklab(0.845217 ... / 0.2) dark, i.e. neutral #333333 and #cccccc at 20 percent, on 255,255,255 and 0,0,0.
  implication: Symptom reproduced in both themes. The hypothesis' prediction (lock primary, label neutral at 20 percent) holds.

- timestamp: 2026-10-31T17:50:00Z
  checked: Falsification in the live DOM, the label's three classes added to the closed rows' svg only, same run
  found: svg fill becomes exactly the label's computed colour in both themes, drawn 214,214,214 on white (1.45:1) and 41,41,41 on black (1.44:1). Control, the same classes on the open nomination row's svg: fill unchanged, rgb(37,70,168) and rgb(104,135,227). axe over the task list with wcag2a/2aa/21aa tags: no violations before or after.
  implication: Root cause confirmed. The group variants are already compiled and the svg honours them; only the placement is missing.

- timestamp: 2026-10-31T17:50:00Z
  checked: The menu in the same run, nav-menu opened, contestant-nav-profile/questions/preview
  found: Closed items carry no lock, each keeps its own icon. The whole item is `!text-neutral/20` (tailwind-merge dropped `!text-neutral`), so icon and text are both drawn 214,214,214 (1.45:1) and 41,41,41 (1.44:1). Open items draw 51,51,51 and 204,204,204.
  implication: The menu does not share this defect because its dim class sits on the element that holds both icon and text. No shared code path with the home's Button. The UI-review finding is about NavItem's closed branch (cue and expandability) and is unrelated to this colour.

- timestamp: 2026-10-31T17:50:00Z
  checked: Tests. grep for neutral/20, fill-, toHaveCSS, getComputedStyle, lockDrawing, LOCK_PATH across apps/frontend/src and tests/tests
  found: Home unit test pins the lock by svg innerHTML (lockDrawing); E2E fixture contestantHomePage pins by path data (LOCK_PATH). Neither reads colour. ContestantNav.svelte.test.ts pins DIMMED '!text-neutral/20' on menu items, not on this icon. Button.svelte.test.ts mounts no icon. toHaveCSS and getComputedStyle hits are the register radios' border and the task list's min-width. Visual baselines are voter-results and contestant-preview only.
  implication: No test is pinned to the current colour, and none would catch the fix regressing.

- timestamp: 2026-10-31T18:00:00Z
  checked: Second pass (scratchpad uat-lock2.mjs, report lock/report2.json). The closed row's label with its text shadow removed inline; a hovered closed row with the classes on its svg; constructed clones of other variants' colour paths, not real call sites.
  found: Label drawn in dark is 71,71,71 (2.26:1) with daisyUI's `.btn` text-shadow `oklch(1 0 0 / .15) 0 .5px` and 41,41,41 (1.44:1) without it. Light is 1.46 with and 1.45 without. Hovered closed row has pointer-events none and a transparent background, so the lock's contrast does not change. Clone icons today: main <button disabled> oklch(0.32109 ... / 0.2), the same colour as the label, so already dim; icon/primary rgb(37,70,168); icon/warning rgb(168,37,37); normal/accent aria-disabled rgb(10,113,107). With the classes on the svg all four equal the label's computed colour, and dark behaves the same.
  implication: Same token, different drawn strength in dark: the lock will be fainter than the label because SVG fill takes no text shadow. The defect applies to every text-coloured Button variant, and the failure needs both conditions (see and_gate).

- timestamp: 2026-10-31T18:00:00Z
  checked: Reason sentence in the first run, and the WCAG exemption via one w3.org-restricted search
  found: Reason sentence draws 102,102,102 (5.74:1) light and 140,140,140 (6.25:1) dark. The search digest of the Understanding 1.4.11 page says inactive components, such as a disabled HTML control, are not required to meet the contrast requirements. The digest, not the page itself, was read.
  implication: 1.45 and 1.44 are below 3:1 as numbers, but the lock sits inside an inactive component and the closed state is also stated at AA by a visible sentence, so the requested colour is not a WCAG blocker. The caller's brief assumed 3:1 applies; this is flagged in the return.

## Resolution

candidate_causes:
  - "code: Button.svelte puts the disabled colour on the label div only (CONFIRMED)"
  - "config: wrong theme tokens (ELIMINATED, --color-primary, --color-neutral measured as staticSettings declares them)"
  - "data: the rows are not actually closed (ELIMINATED, data-status blocked and aria-disabled true on all three)"
and_gate: "yes, two conditions together. (1) The disabled colour is on the label only, and (2) the variant's colour is a text-{color} utility on the root, which the icon inherits through fill-current and which beats daisyUI's `.btn:disabled` colour. The main variant has no text-{color}, so its icon is already dim, which is why this shows on ghost variants only."
root_cause: Button.svelte applies its disabled colour (text-neutral/20, through three group variants in labelClass) to the label div only. The `<Icon name={icon} />` is a sibling outside that div, has no disabled treatment and is fill-current, so it inherits the root element's text-{color}, here text-primary. The entity home only passes the lock as Button's icon prop and chooses no colour.
fix:
verification:
files_changed: []
