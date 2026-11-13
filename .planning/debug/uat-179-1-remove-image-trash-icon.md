---
status: diagnosed
trigger: "uat-179-1-remove-image-trash-icon: Removing a portrait or logo is a Trash icon to the left of the thumbnail, not a separate row."
created: 2026-10-31T17:30:00Z
updated: 2026-10-31T18:05:00Z
---

## Current Focus

hypothesis: CONFIRMED. The Remove button is rendered by the profile +page.svelte as its own flex-column child below the image Input, a default-variant text Button, and ImagePart's thumbnail row has no way to take a control from its caller, so the action cannot appear beside the thumbnail.
test: Done. Read-only Playwright run against :5173; Save never pressed, nothing staged because both entities hold a stored image.
expecting: Met.
next_action: None in this session (goal find_root_cause_only). The fix is for a later plan; see Resolution.
bug_class: Bohrbug (deterministic layout; an operator-requested design change rather than a fault)
candidate_causes:
  - "code: Remove is placed outside Input and is a text Button (confirmed)"
  - "data: Remove is shown as a row only for some entity or image state (eliminated: same row for candidate and organization, at every width measured)"
and_gate: "no. One placement decision; the missing icon and the missing slot are the parts of the change it needs, not separate causes."

## Symptoms

expected: Removing a portrait or logo is a Trash icon to the left of the thumbnail, not a separate row.
actual: "Remove portrait, instead of a separate row, add a Trash icon to the left of the thumbnail"
errors: None reported
reproduction: Test 8 in UAT. Sign in at http://localhost:5173/contestant/login (Sign in with email) as uat-multi@test.openvaa.local, password Password1!. Portrait: http://localhost:5173/contestant/candidate/31be10cf-af6d-4a3d-ae2c-1890e7c5fafa/profile . Logo: http://localhost:5173/contestant/organization/9e2ca970-8fce-4505-8224-f8ec1997b12e/profile .
started: Discovered during UAT

## Eliminated

- hypothesis: The separate row appears only for one entity type or width.
  evidence: Measured on the portrait and the logo at 320, 375 and 1280 px: Remove is outside the profile-image-upload container and as wide as the row every time.
  timestamp: 2026-10-31T17:55:00Z

## Evidence

- timestamp: 2026-10-31T17:35:00Z
  checked: profile +page.svelte, block "{#if imageRemoveLabel}" after the image Input
  found: The Remove is a default-variant Button (w-full, no icon) with class self-center, a sibling of the Input inside the "gap-md flex flex-col" column of the editable fields, not inside the Input.
  implication: It is its own row by construction.
- timestamp: 2026-10-31T17:36:00Z
  checked: Input.svelte image branch, parts/ImagePart.svelte, Input.type.ts
  found: The thumbnail row is ImagePart's; the props handed to it are id, label, value, isLoading, disabled, locked, showRequired, describedBy, invalid, onChange. Input takes no snippet or remove prop, and the image kind drops restProps.
  implication: A caller has no way to place a control in the row; Input and ImagePart both have to change.
- timestamp: 2026-10-31T17:37:00Z
  checked: components/icon/icons.ts and svg/material
  found: No trash or delete entry and no delete.ts. Closest are removeFromList (playlist_remove) and close. Upstream round/delete.svg exists at the source icons.ts names.
  implication: The icon must be added, by the procedure at the head of icons.ts.
- timestamp: 2026-10-31T17:38:00Z
  checked: Button.svelte variant="icon"
  found: aria-label and title both take the text prop; base classes hold min-h-touch and min-w-touch (--spacing-touch 2.75rem); no w-full for this variant. Text node is not rendered.
  implication: The two existing keys keep the accessible name unchanged; unit assertions on textContent stop meaning anything.
- timestamp: 2026-10-31T17:39:00Z
  checked: Selectors that take the first button of the image container
  found: +page.svelte handleImageRemove uses '[data-testid="profile-image-upload"] button'; page.svelte.test.ts lines 626 and 712 use the same; contestantProfilePage.fixture.ts uploadPortrait uses getByRole('button').first(). In the unit test setImage is vi.fn(), so the store keeps the image after the press.
  implication: With a Trash placed first in DOM order these resolve to the Trash wherever an image is shown. See the conclusion in Resolution after measurement.
- timestamp: 2026-10-31T17:50:00Z
  checked: First browser probe, which cloned the first ghost button with an aria-label on the page
  found: DISCARDED. That element was the menu's drawer button with its text (165.8 x 40 px), not a variant="icon" Button, so its numbers say nothing about the Trash.
  implication: Probe rebuilt from the class string Button.svelte derives for variant="icon" color="warning".
- timestamp: 2026-10-31T17:55:00Z
  checked: Current layout, portrait and logo, 320 / 375 / 1280 px, both entities with a stored image, Save never pressed
  found: At 320 px the row is 280 x 60 at y 639.7 and Remove is 280 x 44 at y 782.3, outside the container, with the info line between them. Same shape at the other widths and on the logo.
  implication: Reproduces the report.
- timestamp: 2026-10-31T17:58:00Z
  checked: Client-only element with Button.svelte's icon classes and the Material delete path, injected before the upload button, in all eight runs (light at 320, 375 and 1280 px, dark at 375 px, on both pages)
  found: 56 x 44 px with computed minimum 44 x 44; 90 px spare between label and Trash at 320 px; no page overflow; row stays 60 px high; thumbnail stays flush with the row's end; 8 px clearance above and below against a focus ring of 4 px (2 px width, 2 px offset); tab order Trash then upload; contrast against the row 7.1:1 light, 6.04:1 dark. Screenshots read: looks as the report asks.
  implication: The row has room; no layout change beyond inserting the control. This is an injected element, not the component rendered by Svelte.
- timestamp: 2026-10-31T18:00:00Z
  checked: 179.1-26-PLAN.md truths, visual-regression.spec.ts, git ls-files for generated component docs
  found: The plan asks for "a Remove action" and names no position. No visual baseline covers the profile page. Generated docs for Input, ImagePart and Icon are tracked under apps/docs.
  implication: The row was an implementation choice, not a specified design. No baseline to refresh; docs need regenerating if the component headers change.

## Resolution

root_cause: The profile +page.svelte renders Remove as a default-variant text Button in the editable-fields column after the image Input, so it is a separate row below the Input's info line. ImagePart's thumbnail row takes no control from its caller, and the Icon set has no trash icon. Plan 179.1-26 named no position, so this is a design change rather than a malfunction.
fix:
verification:
files_changed: []
