---
status: diagnosed
trigger: "Test 6 in 179.1 UAT: the app header doesn't show the logout button, it should."
created: 2026-10-31T17:30:00Z
updated: 2026-10-31T18:15:00Z
---

## Current Focus

hypothesis: CONFIRMED. Banner.svelte:49 requires `page.data.token`, which no load has returned since the move to Supabase sessions, so the button never renders in either app.
test: done. Runtime read of page.data; differential rewriting only that read in the served module.
expecting: n/a
next_action: none in this session (goal find_root_cause_only). The fix goes to whoever plans the UAT gaps.
bug_class: Bohrbug. Deterministic on every page and every run. Phase 1.25 SBFL skipped: no failing test exists for this behaviour. Knowledge base absent, MemPalace not available in this session.

reasoning_checkpoint:
  hypothesis: "The header's logout is absent because the second operand of Banner.svelte:49, page.data.token, is always undefined: the Contestant and Admin layout loads return `session`, not `token`."
  confirming_evidence:
    - "page.data read from the app's own $app/state instance has `session` and no `token` key on six contestant pages and on /admin; the HTML and __data.json agree."
    - "Rewriting only that read in the served module makes Log Out appear on every signed-in page in both apps and disappear when signed out."
  falsification_test: "The button stays absent after the read is changed, or appears without changing it. Neither happened: control empty, treatment present, same pages and user."
  fix_rationale: "The read names data the loads no longer supply. Reading the projection they do supply addresses the cause; re-adding `token` to a load would breach the projection rule and fail routes/admin/layout.server.test.ts."
  blind_spots: "The treatment is client-side only, so the server render of the button was not exercised on the pages that gain it. Gated users and the read-failure view were not driven. Axe covered the header on one entity home only. The full E2E suite was not run (forbidden in this session)."
  candidate_causes:
    - "code: stale read in Banner.svelte after the load changed (confirmed)"
    - "code: topBarSettings overlay turning logout off (eliminated)"
    - "code: Banner not mounted or hidden by CSS or responsive classes (eliminated)"
    - "config: a settings flag hiding header actions in the Contestant App (eliminated)"
    - "data: a session absent or not reaching page.data (eliminated)"
  and_gate: "no. The first operand is already 'show' in both apps, shown by the treatment, so the stale read alone accounts for the symptom."

## Symptoms

expected: The app header shows the logout button.
actual: "the app header doesn't show the logout button, it should."
errors: None reported
reproduction: Test 6 in UAT. Sign in at http://localhost:5173/contestant/login (Sign in with email) as uat-multi@test.openvaa.local, password Password1!, then look at the header on any protected page.
started: Discovered during UAT

## Eliminated

- hypothesis: The Banner is unmounted or hidden on protected pages (CSS, responsive classes, `.vaa-basicPage-actions`)
  evidence: The container is present, display flex, visibility visible, opacity 1. It is 0x0 only because it has no children; on preview it holds Close preview at 56x44. The treated button renders inside the viewport at 1280 and 375 wide.
  timestamp: 2026-10-31T17:50:00Z

- hypothesis: A topBarSettings overlay or layout override turns logout off
  evidence: In the Contestant and Admin trees only preview (return) and the two login pages (imageSrc) overlay the top bar, and none touches logout. The treatment shows the button on all pages without touching the settings.
  timestamp: 2026-10-31T17:52:00Z

- hypothesis: The empty action row means something beyond the token read is wrong, since help and feedback are separate conditions
  evidence: Help and feedback default to 'hide' and only voter routes overlay them. In the Contestant App feedback is a menu item. An empty row is the expected result of the one dead condition.
  timestamp: 2026-10-31T17:52:00Z

- hypothesis: The session does not reach page.data on some pages, so a session-keyed gate would also fail
  evidence: page.data.session is { userId, expiresAt } on every signed-in page checked, including /contestant/help and /admin, and the treated button clears on sign-out.
  timestamp: 2026-10-31T17:55:00Z

## Evidence

- timestamp: 2026-10-31T17:35:00Z
  checked: grep of apps/frontend/src for readers and writers of page.data.token
  found: one reader, Banner.svelte:49. No layout load under apps/frontend/src/routes returns a `token` member. contestant/+layout.server.ts and admin/+layout.server.ts return `session` as { userId, expiresAt }.
  implication: static support for the lead; still to observe at runtime and to rule out other gates.

- timestamp: 2026-10-31T17:37:00Z
  checked: git history. main:frontend/.../candidate/+layout.server.ts and 602b79351 on this branch's ancestry; 0a7939aff (2026-08-17); 67786c394 (2026-03-19, not an ancestor of HEAD).
  found: main still has `return { token }` and `$page.data.token` as a pair. On this ancestry 602b79351 still has `{ token }`; 0a7939aff replaced the load with `{ session }` and in the same commit carried the Banner read forward as `page.data.token`. 67786c394 is the original pre-rewrite commit that made the same change and did not touch Banner.
  implication: writer removed, reader kept. The gate has been false since the move to Supabase sessions.

- timestamp: 2026-10-31T17:38:00Z
  checked: topBarSettings defaults and overlays (layoutContext.svelte.ts, contestant/+layout.svelte, admin/+layout.svelte)
  found: all actions default to 'hide'. Contestant and Admin layouts overlay only `logout: 'show'`. Only voter routes turn on help/feedback.
  implication: an empty `.vaa-basicPage-actions` for a contestant is what the lead predicts; help and feedback are not expected there.

- timestamp: 2026-10-31T17:45:00Z
  checked: running app, signed in as uat-multi, reading page.data from the same `$app/state` module instance the app loaded (scratchpad hdr-observe.mjs), plus the hydration HTML and __data.json
  found: on /contestant, entity home, nominations, settings, help and preview, page.data has `session` ({ userId, expiresAt }) and no `token` key. The HTML and __data.json carry `session` and no `token`. `.vaa-basicPage-actions` is present, display flex, visibility visible, opacity 1, no children, 0x0 on those pages; on preview it holds the Close preview button (56x44). Every `{#if}` in Banner is on its false branch ([-1]) elsewhere.
  implication: the Banner is mounted and nothing hides it, so CSS, responsive classes and layout overrides are ruled out as the cause of an empty action row.

- timestamp: 2026-10-31T17:46:00Z
  checked: every visible log out control on those pages and in the drawer
  found: only contestant-home-logout on the entity home. None on /contestant, nominations, settings, help or preview. The drawer has no log out item (Close menu, Start, Nominations, Basic Information, Your Opinions, Preview, Switch profile, Settings, Support, Privacy, Send feedback, languages).
  implication: the header button is the only sign-out path on most pages; no duplication with the menu.

- timestamp: 2026-10-31T17:47:00Z
  checked: Phase 172 deferred-items.md item 1, 172-04-SUMMARY, 173-NAME-MAP items 3 and 37, 173-07-SUMMARY item 7, 173-08-SUMMARY item i
  found: the dead condition was found and recorded in Phase 172, called a product call ("come back keyed on page.data.session, or remove the dead branch and the setting"), and left as it is by 172 and 173. Nothing ruled on it until this UAT.
  implication: the UAT report is that ruling. Nothing removed the button on purpose.

- timestamp: 2026-10-31T17:58:00Z
  checked: differential in the running app with one browser-side change, the served Banner module's `page.data.token` read rewritten to `page.data.session` by Playwright route interception (scratchpad hdr-diff.mjs, hdr-diff2.mjs). No source edit. Control context served as is.
  found: control header empty on /contestant, entity home, nominations, settings, help, privacy; only Close preview on preview. Treatment shows Log Out on all of them, with Close preview beside it on preview. No page errors. At 1280 and 375 wide, light and dark, 56x44 and inside the viewport; primary colour rgb(37,70,168) light, rgb(104,135,227) dark. Signed out, the header is empty again.
  implication: that read is the only thing keeping the button away. topBarSettings already says show; no other gate exists.

- timestamp: 2026-10-31T18:01:00Z
  checked: behaviour of the treated header button against the page's own button, per entity, from fresh sign-ins (uat-multi 3 entities, uat-nonom)
  found: same outcome both ways on all 4 entities. Direct sign-out on the two uat-multi candidates and uat-nonom; on the uat-multi organization the modal opens ("26 opinions to fill"). Continue closes it and stays; confirming signs out, lands on /contestant/login with 0 dialogs open and an empty header. On /contestant/settings it signs out at once and removes the auth cookies. Closed dialogs: 3 in the DOM, 0 by role, so `getByRole('dialog')` stays exact.
  implication: the existing LogoutButton works unchanged in the header.

- timestamp: 2026-10-31T18:03:00Z
  checked: Admin App, admin@openvaa.test, control and treatment; axe on the header (wcag2a/aa, 21a/aa) in the treatment, light and dark
  found: page.data has session and no token on /admin. Control: no log out control anywhere, header or menu. Treatment: Log Out in the header; pressing it lands on /admin/login. Axe: 0 violations in the header, both schemes, on one entity home.
  implication: the Admin App has the same defect and, without the header button, no sign-out control at all.

- timestamp: 2026-10-31T18:04:00Z
  checked: uat-single sign-in
  found: "Wrong email or password" with Password1!. uat-nonom and uat-multi sign in.
  implication: unrelated to this issue and not investigated. Dropped that account from the checks.

- timestamp: 2026-10-31T18:08:00Z
  checked: what pins the header's logout. Unit tests, E2E fixtures and specs, visual baselines, testIds.
  found: nothing pins it. No Banner test; Layout.svelte.test.ts mocks `actions: {}`. E2E and a11y use the page's button by test id contestant-home-logout. LogoutButton.svelte.test.ts pins when the modal asks, wherever the button is mounted. The only role-and-name lookup is scoped inside the dialog. Tab presses in specs are relative to a focused field. The baselines contestant-preview-desktop.png and -mobile.png hold a header with Close only, so they record the defect and will change with a fix. `page.data` is typed `App.PageData & Record<string, any>`, so `token` type-checks.
  implication: no gate could catch it, and a fix must regenerate those two baselines.

- timestamp: 2026-10-31T18:10:00Z
  checked: open modal across a Back navigation, page button (control) against treated header button, organization entity (scratchpad hdr-back.mjs)
  found: page button, modal gone after Back, still signed in at /contestant after 32 s. Header button, modal still open after Back and still counting; after 32 s the user is signed out at /contestant/login.
  implication: the header's LogoutButton outlives client navigation, the page's does not. The modal stays visible while it counts, so this is not silent, but it is a behaviour difference for the fix to decide on. `dialog[open]` strips view-transition names (viewTransition.ts), so the modal invariant holds on that path by code reading.

- timestamp: 2026-10-31T18:12:00Z
  checked: duplicates. main's Banner and home page; menus on HEAD and main; gates and views with their own LogoutButton.
  found: main has the header button and the home page's button together, so the pair on the entity home is the original design. No menu in either app has a log out item, on HEAD or in history. SetPasswordGate, TermsOfUseGate, IdentityProviderGate, NothingToEdit and ReadFailure each carry their own control and will gain the header's beside it.
  implication: no menu duplication. Page-and-header pairs return as on main.

## Resolution

root_cause: Banner.svelte:49 renders the header's logout only when `page.data.token` is truthy, and no load returns `token`. Commit 0a7939aff (2026-08-17; first made as 67786c394, 2026-03-19, feat(24-02), outside HEAD's ancestry) replaced `{ token }` in the Contestant and Admin layout loads with a session and kept the Banner read. Those loads now return `session` as { userId, expiresAt }, so the condition is always false in both apps.
fix: not applied (find_root_cause_only)
verification: differential in the running app, control against one rewritten read, on the Contestant and Admin Apps
files_changed: []
